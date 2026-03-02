/**
 * NodeInspector – shows and edits the parameters of the selected scene node.
 */

import React from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { findNodeById, NODE_TYPES, BOOLEAN_OPS } from '../../core/model/sceneDocument';
import Slider from '../common/Slider';
import ColorPicker from '../common/ColorPicker';
import KeycapInspector from './KeycapInspector';

// ─── Vec3 editor ─────────────────────────────────────────────────────────────

function Vec3Editor({ label, value, onChange }) {
  const v = value ?? [0, 0, 0];
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <div className="flex gap-1">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <div key={axis} className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 text-center mb-0.5">{axis}</div>
            <input
              type="number"
              value={v[i] ?? 0}
              step="1"
              onChange={e => {
                const next = [...v];
                next[i] = parseFloat(e.target.value) || 0;
                onChange(next);
              }}
              className="w-full bg-gray-900 text-white text-xs px-1 py-1 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Type-specific inspector sections ────────────────────────────────────────

function PrimitiveInspector({ node, onUpdate }) {
  const p       = node.params   ?? {};
  const setP    = (key, val) => onUpdate({ params: { ...p, [key]: val } });
  const setMat  = (color)    => onUpdate({ material: { ...(node.material ?? {}), color } });

  return (
    <>
      {node.primitive === 'box' && (
        <>
          <Slider label="Width (mm)"  min={1} max={200} step={0.5} value={p.width  ?? 18}   onChange={v => setP('width',  v)} unit="mm" />
          <Slider label="Height (mm)" min={1} max={200} step={0.5} value={p.height ?? 11.5} onChange={v => setP('height', v)} unit="mm" />
          <Slider label="Depth (mm)"  min={1} max={200} step={0.5} value={p.depth  ?? 18}   onChange={v => setP('depth',  v)} unit="mm" />
        </>
      )}
      {node.primitive === 'cylinder' && (
        <>
          <Slider label="Radius Top (mm)"    min={0.5} max={100} step={0.5} value={p.radiusTop    ?? 9}    onChange={v => setP('radiusTop',    v)} unit="mm" />
          <Slider label="Radius Bottom (mm)" min={0.5} max={100} step={0.5} value={p.radiusBottom ?? 9}    onChange={v => setP('radiusBottom', v)} unit="mm" />
          <Slider label="Height (mm)"        min={1}   max={200} step={0.5} value={p.height       ?? 11.5} onChange={v => setP('height',       v)} unit="mm" />
        </>
      )}
      {node.primitive === 'sphere' && (
        <Slider label="Radius (mm)" min={0.5} max={100} step={0.5} value={p.radius ?? 9} onChange={v => setP('radius', v)} unit="mm" />
      )}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Color</label>
        <ColorPicker value={node.material?.color ?? '#c8dff0'} onChange={setMat} />
      </div>
    </>
  );
}

function BooleanInspector({ node, onUpdate }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Operation</label>
      <select
        value={node.operation ?? 'subtract'}
        onChange={e => onUpdate({ operation: e.target.value, name: `Boolean (${e.target.value})` })}
        className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700"
      >
        {BOOLEAN_OPS.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NodeInspector() {
  const scene      = useSceneStore(s => s.scene);
  const selectedId = useSceneStore(s => s.selectedId);
  const updateNode = useSceneStore(s => s.updateNode);

  const node = findNodeById(scene?.root, selectedId);

  if (!selectedId || !node) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Select a node in the Outliner to edit its properties.
      </div>
    );
  }

  const onUpdate = patch => updateNode(selectedId, patch);

  return (
    <div className="p-4 space-y-3 overflow-y-auto">
      {/* Node name */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Name</label>
        <input
          type="text"
          value={node.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className="w-full bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Type badge */}
      <div className="text-xs text-gray-500">Type: <span className="text-gray-300">{node.type}</span></div>

      {/* Type-specific fields */}
      {node.type === NODE_TYPES.PRIMITIVE && <PrimitiveInspector node={node} onUpdate={onUpdate} />}
      {node.type === NODE_TYPES.KEYCAP    && <KeycapInspector    node={node} onUpdate={onUpdate} />}
      {node.type === NODE_TYPES.BOOLEAN   && <BooleanInspector   node={node} onUpdate={onUpdate} />}

      {/* Transform (all node types) */}
      <div className="border-t border-gray-700 pt-3 space-y-2">
        <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Transform</div>
        <Vec3Editor
          label="Position (mm)"
          value={node.position}
          onChange={v => onUpdate({ position: v })}
        />
        <Vec3Editor
          label="Rotation (rad)"
          value={node.rotation}
          onChange={v => onUpdate({ rotation: v })}
        />
      </div>
    </div>
  );
}
