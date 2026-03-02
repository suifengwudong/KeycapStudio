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
import { NODE_TYPES } from '../../core/model/sceneDocument';
import { PROFILES } from '../../constants/profiles';
import { CHERRY_CROSS_SIZE } from '../../constants/cherry';
import { OptimizedKeycapGenerator } from '../../core/geometry/OptimizedKeycapGenerator';

// ─── Module-level instant-preview generator + LRU cache ──────────────────────

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
  // Uses depthTest:false so the cross is ALWAYS visible regardless of camera
  // angle or whether the keycap body is in front.
  const stemDashLines = useMemo(() => {
    const positions = new Float32Array([
      // Horizontal arm (along X)
      -CHERRY_CROSS_SIZE / 2, 0, 0,
       CHERRY_CROSS_SIZE / 2, 0, 0,
      // Lateral arm (along Z)
      0, 0, -CHERRY_CROSS_SIZE / 2,
      0, 0,  CHERRY_CROSS_SIZE / 2,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineDashedMaterial({
      color      : '#ff6600',
      dashSize   : 0.8,
      gapSize    : 0.4,
      depthTest  : false,   // always draw on top of everything
      depthWrite : false,
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.computeLineDistances();
    lines.renderOrder = 999;
    return lines;
  }, []);

  // Dispose Three.js objects when the component unmounts.
  useEffect(() => {
    return () => {
      stemDashLines.geometry.dispose();
      stemDashLines.material.dispose();
    };
  }, [stemDashLines]);

  // Emboss dashed-outline indicator ─────────────────────────────────────────
  // Instead of a TextGeometry (which requires async font loading and can be
  // occluded), we draw a dashed rectangle outline on the keycap top surface
  // that indicates the approximate text area.  depthTest:false ensures it is
  // ALWAYS visible regardless of camera position.
  const embossEnabled  = p.embossEnabled ?? false;
  const embossText     = (p.embossText ?? '').trim();
  const embossFontSize = p.embossFontSize ?? 5;
  const embossDepth    = p.embossDepth ?? 1.0;
  const embossColor    = p.embossColor ?? '#222222';

  const embossOutlineLines = useMemo(() => {
    if (!embossEnabled || !embossText) return null;
    // Approximate text bounding box based on font size and character count.
    // Half-widths/heights in mm (XZ plane, Y is up).
    const charCount = Math.max(1, embossText.length);
    const hw = Math.max(2, Math.min(embossFontSize * charCount * 0.55, 12)); // half-width
    const hh = Math.max(2, Math.min(embossFontSize * 1.3, 10));              // half-height (Z)

    // Rectangle corners in XZ plane (y stays 0; we position the primitive)
    const positions = new Float32Array([
      // Top edge
      -hw, 0, -hh,   hw, 0, -hh,
      // Right edge
       hw, 0, -hh,   hw, 0,  hh,
      // Bottom edge
       hw, 0,  hh,  -hw, 0,  hh,
      // Left edge
      -hw, 0,  hh,  -hw, 0, -hh,
    ]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineDashedMaterial({
      color      : embossColor,
      dashSize   : 0.6,
      gapSize    : 0.3,
      depthTest  : false,
      depthWrite : false,
    });
    const lines = new THREE.LineSegments(geo, mat);
    lines.computeLineDistances();
    lines.renderOrder = 999;
    return lines;
  }, [embossEnabled, embossText, embossFontSize, embossColor]);

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

      {/* Cherry MX stem hole indicator ─────────────────────────────────────
          Dashed orange cross placed 0.5 mm above the keycap top surface.
          depthTest:false guarantees visibility from any camera angle.       */}
      {hasStem && (
        <primitive object={stemDashLines} position={[0, resolvedHeight + 0.5, 0]} />
      )}

      {/* Emboss text area indicator ──────────────────────────────────────
          Dashed rectangle outline matching the approximate text bounding
          box placed 0.5 mm above the top surface.
          The actual embossed geometry only appears in the exported STL.    */}
      {embossOutlineLines && (
        <primitive object={embossOutlineLines} position={[0, resolvedHeight + 0.5, 0]} />
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
