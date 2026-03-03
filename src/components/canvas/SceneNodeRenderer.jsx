/**
 * SceneNodeRenderer – renders a sceneDocument tree inside a React Three Fiber canvas.
 *
 * Preview pipeline: no CSG, fast.
 * Boolean nodes are rendered as transparent child overlays.
 *
 * Keycap preview strategy
 * ───────────────────────
 * Geometry is computed synchronously via useMemo so the keycap appears
 * immediately on first render without a loading/placeholder phase.
 * A module-level LRU cache avoids recomputing the same shape twice.
 * Expensive CSG (stem hole, wall hollow) only runs at STL export time.
 */

import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { NODE_TYPES } from '../../core/model/sceneDocument';
import { PROFILES } from '../../constants/profiles';
import { CHERRY_CROSS_SIZE, CHERRY_CROSS_THICK, CHERRY_STEM_DEPTH, CHERRY_DISH_DEPTH, CHERRY_TOP_WIDTH, CHERRY_TOP_DEPTH, CHERRY_DISH_EXPONENT } from '../../constants/cherry';
import { OptimizedKeycapGenerator, getKeycapFont } from '../../core/geometry/OptimizedKeycapGenerator';

// ─── Module-level instant-preview generator + LRU cache ──────────────────────

/** Fixed vivid colour used for the emboss text dashed outline indicator.
 *  Kept separate from embossColor (the user-chosen material colour) so the
 *  outline is always clearly visible regardless of the keycap / emboss colour. */
const EMBOSS_OUTLINE_COLOR = '#00e5ff';

/**
 * Adjust every vertex of a (pre-rotation) TextGeometry so the extrusion base
 * conforms to the keycap's concave top surface (dish) rather than a flat plane.
 *
 * Coordinate mapping after the group's -π/2 X-rotation:
 *   text (vx, vy, vz)  →  world (vx, vz, -vy)
 * The keycap top surface at world (wx, wz) = (vx, -vy) has
 *   Y = keycapHeight – sag(vx, vy)   where dist = √(vx²+vy²)
 * Subtracting sag from vz shifts the whole extrusion column down so its base
 * tracks the curved surface instead of a flat plane at the centre height.
 *
 * @param {THREE.BufferGeometry} geo       – TextGeometry centred in X and Y
 * @param {number}               dishDepth – dish concavity in mm
 * @param {number}               topWidth  – keycap top surface width in mm
 * @param {number}               topDepth  – keycap top surface depth in mm
 */
function _applyDishSnap(geo, dishDepth, topWidth, topDepth) {
  const maxDim = Math.max(topWidth, topDepth) / 2;
  const pos    = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx   = pos.getX(i);
    const vy   = pos.getY(i);
    const dist = Math.sqrt(vx * vx + vy * vy);
    const nd   = Math.min(dist / maxDim, 1.0);
    const sag  = Math.pow(nd, CHERRY_DISH_EXPONENT) * dishDepth;
    pos.setZ(i, pos.getZ(i) - sag);
  }
  pos.needsUpdate = true;
}

const _previewGen = new OptimizedKeycapGenerator();
/** Keyed by shape-affecting params only (color / hasStem / wallThickness excluded). */
const _geoCache = new Map();
const _GEO_CACHE_MAX = 20;

/**
 * Return a cached THREE.BufferGeometry for the given preview params.
 * Creates a new one via generateInstantPreview when there is a cache miss.
 */
function _getPreviewGeometry(profile, size, topRadius, dishDepth, height) {
  const r = typeof topRadius === 'number' ? topRadius.toFixed(2) : 'default';
  const d = typeof dishDepth === 'number' ? dishDepth.toFixed(2) : 'default';
  const h = typeof height    === 'number' ? height.toFixed(2)    : 'default';
  const key = `${profile}|${size}|${r}|${d}|${h}`;

  if (_geoCache.has(key)) return _geoCache.get(key);

  const geo = _previewGen.generateInstantPreview(
    { profile, size, topRadius, dishDepth, height }
  ).geometry;

  // Evict the oldest (first-inserted) entry when the cache is full.
  // This is a simple FIFO policy; the small cache size (20) makes it sufficient
  // for typical editing sessions where only a handful of unique shapes are used.
  if (_geoCache.size >= _GEO_CACHE_MAX) {
    _geoCache.delete(_geoCache.keys().next().value);
  }
  _geoCache.set(key, geo);
  return geo;
}

// ─── Primitive ────────────────────────────────────────────────────────────────

function PrimitiveNode({ node }) {
  const p   = node.params   ?? {};
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];
  const col = node.material?.color ?? '#c8dff0';

  let geo;
  switch (node.primitive) {
    case 'cylinder':
      geo = (
        <cylinderGeometry args={[
          p.radiusTop    ?? 9,
          p.radiusBottom ?? 9,
          p.height       ?? 11.5,
          p.radialSegments ?? 32,
        ]} />
      );
      break;
    case 'sphere':
      geo = (
        <sphereGeometry args={[
          p.radius         ?? 9,
          p.widthSegments  ?? 32,
          p.heightSegments ?? 16,
        ]} />
      );
      break;
    case 'box':
    default:
      geo = (
        <boxGeometry args={[p.width ?? 18, p.height ?? 11.5, p.depth ?? 18]} />
      );
  }

  return (
    <mesh position={pos} rotation={rot} castShadow receiveShadow>
      {geo}
      <meshStandardMaterial color={col} roughness={0.35} metalness={0.08} />
    </mesh>
  );
}

// ─── KeycapTemplate ───────────────────────────────────────────────────────────

function KeycapTemplateNode({ node }) {
  const p   = node.params   ?? {};
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];

  const profile   = p.profile   ?? 'Cherry';
  const size      = p.size      ?? '1u';
  const topRadius = p.topRadius ?? 0.5;
  // dishDepth / height may be null → _resolveParams falls back to profile defaults
  const dishDepth = p.dishDepth;
  const height    = p.height;
  const color     = p.color ?? '#c8dff0';
  const hasStem   = p.hasStem ?? true;

  // Resolve actual keycap height for overlay positioning.
  const resolvedHeight = height != null
    ? height
    : (PROFILES[profile] ?? PROFILES['Cherry']).baseHeight;

  // Synchronous geometry lookup: no loading state, keycap renders on first frame.
  // Only recomputes when shape-affecting params change; color/hasStem/wallThickness
  // do not affect the preview mesh so they are intentionally excluded.
  const geometry = useMemo(() => {
    try {
      return _getPreviewGeometry(profile, size, topRadius, dishDepth, height);
    } catch {
      return null;
    }
  }, [profile, size, topRadius, dishDepth, height]);

  // Cherry MX stem hole dashed-line cross indicator ─────────────────────────
  // Draws the FULL 3D outline of the cross-shaped hole:
  //   • bottom face (y=0, keycap bottom) as a closed 12-edge loop
  //   • top face    (y=CHERRY_STEM_DEPTH, inside keycap) as a closed 12-edge loop
  //   • 12 vertical edges connecting corresponding corners
  // depthTest:false keeps the indicator always visible at any camera angle.
  const stemCrossLine = useMemo(() => {
    const chs = CHERRY_CROSS_SIZE  / 2;  // arm half-length
    const cht = CHERRY_CROSS_THICK / 2;  // arm half-thickness
    const H   = CHERRY_STEM_DEPTH;       // hole depth

    // 12 corners of the cross outline in XZ plane (CW, starting top-left of top arm):
    //        ┌───┐
    //   ─────┤   ├─────
    //   ─────┤   ├─────
    //        └───┘
    const corners = [
      [-cht, -chs],  // A
      [ cht, -chs],  // B
      [ cht, -cht],  // C
      [ chs, -cht],  // D
      [ chs,  cht],  // E
      [ cht,  cht],  // F
      [ cht,  chs],  // G
      [-cht,  chs],  // H
      [-cht,  cht],  // I
      [-chs,  cht],  // J
      [-chs, -cht],  // K
      [-cht, -cht],  // L
    ];

    const n = corners.length;
    const pts = [];

    // Bottom face loop (y = 0)
    for (let i = 0; i < n; i++) {
      const [x0, z0] = corners[i];
      const [x1, z1] = corners[(i + 1) % n];
      pts.push(new THREE.Vector3(x0, 0, z0), new THREE.Vector3(x1, 0, z1));
    }
    // Top face loop (y = H)
    for (let i = 0; i < n; i++) {
      const [x0, z0] = corners[i];
      const [x1, z1] = corners[(i + 1) % n];
      pts.push(new THREE.Vector3(x0, H, z0), new THREE.Vector3(x1, H, z1));
    }
    // 12 vertical edges
    for (const [x, z] of corners) {
      pts.push(new THREE.Vector3(x, 0, z), new THREE.Vector3(x, H, z));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
      color     : '#ff6600',
      dashSize  : 0.5,
      gapSize   : 0.3,
      depthTest : false,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.computeLineDistances();
    lines.renderOrder = 999;
    return lines;
  }, []);

  // Dispose Three.js objects when the component unmounts.
  useEffect(() => {
    return () => {
      stemCrossLine.geometry.dispose();
      stemCrossLine.material.dispose();
    };
  }, [stemCrossLine]);

  // Emboss text indicators ────────────────────────────────────────────────────
  // Two complementary visuals, both positioned at the keycap top surface (原位):
  //
  //  1. Solid preview mesh  – TextGeometry rendered as a plain mesh coloured with
  //     embossColor.  No CSG needed; placed directly on the top face.  This is the
  //     low-cost "挖去的方法" that gives actual 3-D depth in the preview.
  //
  //  2. Dashed outline      – EdgesGeometry of the same text rendered as dashed
  //     LineSegments with depthTest:false so the outline is ALWAYS visible from
  //     any camera angle, even when the solid mesh is hidden by the keycap body.
  const embossEnabled  = p.embossEnabled ?? false;
  const embossText     = (p.embossText ?? '').trim();
  const embossFontSize = p.embossFontSize ?? 5;
  const embossDepth    = p.embossDepth ?? 1.0;
  const embossColor    = p.embossColor ?? '#222222';

  // Resolved dish depth used for surface-snapping the preview emboss text.
  const resolvedDishDepth = dishDepth != null ? dishDepth : CHERRY_DISH_DEPTH;

  // Solid emboss preview mesh (low-cost: no CSG, just TextGeometry mesh).
  const embossSolidGeo = useMemo(() => {
    if (!embossEnabled || !embossText) return null;
    try {
      const font = getKeycapFont();
      if (!font) return null;
      const textGeo = new TextGeometry(embossText, {
        font,
        size         : Math.max(2, Math.min(10, embossFontSize)),
        height       : Math.max(0.1, Math.min(2.0, embossDepth)),
        curveSegments: 4,
        bevelEnabled : false,
      });
      textGeo.computeBoundingBox();
      const { min, max } = textGeo.boundingBox;
      textGeo.translate(-(max.x + min.x) / 2, -(max.y + min.y) / 2, 0);
      // Snap the extrusion base to the keycap's concave top surface so the
      // text lies on the dish rather than hovering on a flat plane.
      _applyDishSnap(textGeo, resolvedDishDepth, CHERRY_TOP_WIDTH, CHERRY_TOP_DEPTH);
      return textGeo;
    } catch {
      return null;
    }
  }, [embossEnabled, embossText, embossFontSize, embossDepth, resolvedDishDepth]);

  useEffect(() => {
    return () => { embossSolidGeo?.dispose(); };
  }, [embossSolidGeo]);

  const embossOutlineLines = useMemo(() => {
    if (!embossEnabled || !embossText) return null;
    try {
      const font = getKeycapFont();
      if (!font) return null;

      // Build the same TextGeometry that the STL export uses.
      const textGeo = new TextGeometry(embossText, {
        font,
        size         : Math.max(2, Math.min(10, embossFontSize)),
        height       : Math.max(0.1, Math.min(2.0, embossDepth)),
        curveSegments: 4,
        bevelEnabled : false,
      });
      textGeo.computeBoundingBox();
      const { min, max } = textGeo.boundingBox;
      // Centre in XY before the -π/2 rotation applied at render time.
      textGeo.translate(
        -(max.x + min.x) / 2,
        -(max.y + min.y) / 2,
        0,
      );
      // Snap to the keycap dish surface for consistent appearance with the solid mesh.
      _applyDishSnap(textGeo, resolvedDishDepth, CHERRY_TOP_WIDTH, CHERRY_TOP_DEPTH);

      // EdgesGeometry extracts every sharp edge from the extruded solid,
      // giving a faithful dashed-line silhouette of the actual text volume.
      const edgesGeo = new THREE.EdgesGeometry(textGeo);
      textGeo.dispose();  // original solid geometry no longer needed

      const mat = new THREE.LineDashedMaterial({
        // Use a fixed vivid cyan so the outline is always clearly visible
        // regardless of the user's embossColor setting.
        color     : EMBOSS_OUTLINE_COLOR,
        dashSize  : 0.3,
        gapSize   : 0.2,
        depthTest : false,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(edgesGeo, mat);
      lines.computeLineDistances();
      lines.renderOrder = 999;
      return lines;
    } catch {
      // Font may not yet be available (e.g. in test environments).
      // A null return causes the emboss indicator to be hidden gracefully.
      return null;
    }
  }, [embossEnabled, embossText, embossFontSize, embossDepth, resolvedDishDepth]);

  // Dispose emboss outline on change or unmount to prevent leaks.
  useEffect(() => {
    return () => {
      embossOutlineLines?.geometry.dispose();
      embossOutlineLines?.material.dispose();
    };
  }, [embossOutlineLines]);

  if (!geometry) {
    // Fallback rendered only when generateInstantPreview throws (should not occur in practice)
    return (
      <mesh position={pos} rotation={rot}>
        <boxGeometry args={[18, 11.5, 18]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.3} wireframe />
      </mesh>
    );
  }

  return (
    <group position={pos} rotation={rot}>
      {/* Keycap outer shell */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.08} />
      </mesh>

      {/* Cherry MX stem hole cross outline ──────────────────────────────────
          12-corner dashed cross shaped to the real Cherry MX arm dimensions
          (CHERRY_CROSS_SIZE × CHERRY_CROSS_THICK).  Placed at y=0 (the keycap
          bottom face, 原位) so the indicator sits exactly where the hole is.
          depthTest:false guarantees visibility from any camera angle.         */}
      {hasStem && (
        <primitive object={stemCrossLine} position={[0, 0, 0]} />
      )}

      {/* Emboss text 3-D preview (低代价/挖去的方法) ──────────────────────────
          Solid TextGeometry mesh placed directly on the keycap top surface
          (原位, y ≈ resolvedHeight).  No CSG needed — the mesh sits on top of
          the keycap shell and is coloured with embossColor for a realistic
          preview of the raised text.  +0.02 mm offset prevents z-fighting
          between the text base face and the keycap top face.                  */}
      {embossSolidGeo && (
        <group position={[0, resolvedHeight + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={embossSolidGeo}>
            <meshStandardMaterial color={embossColor} roughness={0.35} metalness={0.08} />
          </mesh>
        </group>
      )}

      {/* Emboss text dashed outline ─────────────────────────────────────────
          TextGeometry → EdgesGeometry rendered as dashed LineSegments at the
          keycap top surface (原位, y ≈ resolvedHeight).  Uses a fixed vivid
          cyan (#00e5ff) so the outline is always clearly visible regardless
          of the user's embossColor.  depthTest:false guarantees visibility
          from any camera angle.                                               */}
      {embossOutlineLines && (
        <group position={[0, resolvedHeight + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <primitive object={embossOutlineLines} />
        </group>
      )}
    </group>
  );
}

// ─── Boolean (preview) ────────────────────────────────────────────────────────

function GhostPrimitive({ node }) {
  const p   = node.params   ?? {};
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];
  const col = node.material?.color ?? '#c8dff0';

  let geo;
  switch (node.primitive) {
    case 'cylinder':
      geo = <cylinderGeometry args={[p.radiusTop ?? 9, p.radiusBottom ?? 9, p.height ?? 11.5, p.radialSegments ?? 32]} />;
      break;
    case 'sphere':
      geo = <sphereGeometry args={[p.radius ?? 9, p.widthSegments ?? 32, p.heightSegments ?? 16]} />;
      break;
    default:
      geo = <boxGeometry args={[p.width ?? 18, p.height ?? 11.5, p.depth ?? 18]} />;
  }

  return (
    <mesh position={pos} rotation={rot}>
      {geo}
      <meshStandardMaterial color={col} roughness={0.35} metalness={0.08} transparent opacity={0.25} />
    </mesh>
  );
}

function BooleanNodePreview({ node }) {
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];
  const children = node.children ?? [];

  return (
    <group position={pos} rotation={rot}>
      {children.map((child, i) =>
        i === 0
          ? <SceneNode key={child.id} node={child} />
          : <GhostNode key={child.id} node={child} />
      )}
    </group>
  );
}

/** Render a node tree with all leaf meshes ghosted (transparent). */
function GhostNode({ node }) {
  if (!node) return null;
  if (node.type === NODE_TYPES.PRIMITIVE) return <GhostPrimitive node={node} />;
  // For other types (keycap, group, nested boolean) just render normally at lower opacity
  // by applying ghost to their primitive leaves
  if (node.type === NODE_TYPES.GROUP || node.type === NODE_TYPES.BOOLEAN) {
    const pos = node.position ?? [0, 0, 0];
    const rot = node.rotation ?? [0, 0, 0];
    return (
      <group position={pos} rotation={rot}>
        {(node.children ?? []).map(c => <GhostNode key={c.id} node={c} />)}
      </group>
    );
  }
  // KeycapTemplate – render normally (cloning material for transparency is complex here)
  return <SceneNode node={node} />;
}

// ─── Group ────────────────────────────────────────────────────────────────────

function GroupNode({ node }) {
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];
  return (
    <group position={pos} rotation={rot}>
      {(node.children ?? []).map(child => (
        <SceneNode key={child.id} node={child} />
      ))}
    </group>
  );
}

// ─── Generic dispatcher ───────────────────────────────────────────────────────

function SceneNode({ node }) {
  if (!node) return null;
  switch (node.type) {
    case NODE_TYPES.PRIMITIVE: return <PrimitiveNode      node={node} />;
    case NODE_TYPES.KEYCAP   : return <KeycapTemplateNode node={node} />;
    case NODE_TYPES.BOOLEAN  : return <BooleanNodePreview node={node} />;
    case NODE_TYPES.GROUP    : return <GroupNode          node={node} />;
    default: return null;
  }
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function SceneNodeRenderer({ scene }) {
  if (!scene?.root) return null;
  return <SceneNode node={scene.root} />;
}
