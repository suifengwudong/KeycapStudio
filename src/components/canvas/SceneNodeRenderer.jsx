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

import React, { useMemo } from 'react';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { NODE_TYPES } from '../../core/model/sceneDocument';
import { PROFILES } from '../../constants/profiles';
import {
  CHERRY_CROSS_SIZE,
  CHERRY_CROSS_THICK,
} from '../../constants/cherry';
import { OptimizedKeycapGenerator, getKeycapFont } from '../../core/geometry/OptimizedKeycapGenerator';

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
  const col = node.material?.color ?? '#cccccc';

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

// Height (mm) of the stem cross indicator slab: half protrudes below keycap
// bottom so it is visible when the user rotates to look from below.
const STEM_INDICATOR_H = 1.0;

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
  const color     = p.color ?? '#ffffff';
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

  // Emboss text geometry (optional) ─────────────────────────────────────────
  // TextGeometry is created synchronously using the module-level font singleton.
  // The geometry is centred in the XY plane (before rotation); a -π/2 rotation
  // around X lays it flat on the horizontal keycap top surface.
  const embossEnabled  = p.embossEnabled ?? false;
  const embossText     = (p.embossText ?? '').trim();
  const embossFontSize = p.embossFontSize ?? 5;
  const embossDepth    = p.embossDepth ?? 0.4;

  const embossGeo = useMemo(() => {
    if (!embossEnabled || !embossText) return null;
    try {
      const font = getKeycapFont();
      if (!font) return null;
      const geo  = new TextGeometry(embossText, {
        font,
        size         : Math.max(2, Math.min(10, embossFontSize)),
        height       : Math.max(0.1, Math.min(2.0, embossDepth)),
        curveSegments: 4,
        bevelEnabled : false,
      });
      geo.computeBoundingBox();
      const { min, max } = geo.boundingBox;
      // Centre in XY before rotation (after -π/2 around X, X stays X and Y→Z)
      geo.translate(-(max.x + min.x) / 2, -(max.y + min.y) / 2, 0);
      return geo;
    } catch {
      return null;
    }
  }, [embossEnabled, embossText, embossFontSize, embossDepth]);

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
          A dark cross slab centred at y = −STEM_INDICATOR_H/2 so its lower half
          protrudes below the keycap bottom face (y = 0) and is clearly visible
          when the user orbits to look from underneath. */}
      {hasStem && (
        <>
          <mesh position={[0, -STEM_INDICATOR_H / 2, 0]}>
            <boxGeometry args={[CHERRY_CROSS_SIZE, STEM_INDICATOR_H, CHERRY_CROSS_THICK]} />
            <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
          </mesh>
          <mesh position={[0, -STEM_INDICATOR_H / 2, 0]}>
            <boxGeometry args={[CHERRY_CROSS_THICK, STEM_INDICATOR_H, CHERRY_CROSS_SIZE]} />
            <meshStandardMaterial color="#1a1a1a" roughness={1} metalness={0} />
          </mesh>
        </>
      )}

      {/* Emboss text preview ──────────────────────────────────────────────
          TextGeometry (XY plane, extruding +Z) is rotated -π/2 around X so it
          lies flat in the XZ plane extruding upward (+Y) from the keycap top.
          A 0.05 mm clearance avoids z-fighting with the dish surface. */}
      {embossGeo && (
        <mesh
          geometry={embossGeo}
          position={[0, resolvedHeight + 0.05, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow
        >
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.08} />
        </mesh>
      )}
    </group>
  );
}

// ─── Boolean (preview) ────────────────────────────────────────────────────────

function GhostPrimitive({ node }) {
  const p   = node.params   ?? {};
  const pos = node.position ?? [0, 0, 0];
  const rot = node.rotation ?? [0, 0, 0];
  const col = node.material?.color ?? '#cccccc';

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
