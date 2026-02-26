/**
 * Outliner – shows the scene document node tree.
 * Lets users select, add, and delete nodes.
 */

import React from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { NODE_TYPES } from '../../core/model/sceneDocument';

// ─── Icons ────────────────────────────────────────────────────────────────────

const TYPE_ICON = {
  [NODE_TYPES.PRIMITIVE]: '▭',
  [NODE_TYPES.BOOLEAN]  : '⊕',
  [NODE_TYPES.GROUP]    : '▿',
  [NODE_TYPES.KEYCAP]   : '⌨',
};

// ─── Recursive row ────────────────────────────────────────────────────────────

function OutlinerRow({ node, depth = 0 }) {
  const selectedId = useSceneStore(s => s.selectedId);
  const selectNode = useSceneStore(s => s.selectNode);
  const deleteNode = useSceneStore(s => s.deleteNode);

  const isSelected = selectedId === node.id;
  const isRoot     = node.id === 'root';
  const children   = node.children ?? [];

  return (
    <>
      <div
        className={
          `flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded select-none
           ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-200'}`
        }
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => selectNode(node.id)}
      >
        <span className="text-xs w-4 text-center shrink-0">
          {TYPE_ICON[node.type] ?? '○'}
        </span>
        <span className="flex-1 truncate text-xs">{node.name}</span>
        {!isRoot && isSelected && (
          <button
            className="text-red-400 hover:text-red-300 px-1 text-xs"
            title="Delete node"
            onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
          >
            ✕
          </button>
        )}
      </div>
      {children.map(child => (
        <OutlinerRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function AddBtn({ label, title, onClick }) {
  return (
    <button
      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
      title={title}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Outliner() {
  const scene      = useSceneStore(s => s.scene);
  const selectedId = useSceneStore(s => s.selectedId);
  const addKeycap  = useSceneStore(s => s.addKeycap);
  const addBox     = useSceneStore(s => s.addBox);
  const addCylinder= useSceneStore(s => s.addCylinder);
  const addSphere  = useSceneStore(s => s.addSphere);
  const addBoolean = useSceneStore(s => s.addBoolean);
  const addGroup   = useSceneStore(s => s.addGroup);

  // Add to selected node if it can hold children; otherwise add to root.
  const target = selectedId ?? 'root';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 shrink-0">
        <h2 className="text-xs font-semibold text-gray-300 uppercase tracking-wide mb-2">
          Outliner
        </h2>
        <div className="flex gap-1 flex-wrap">
          <AddBtn label="+ Keycap"   title="Add Keycap node"    onClick={() => addKeycap(target)} />
          <AddBtn label="+ Box"      title="Add Box primitive"  onClick={() => addBox(target)} />
          <AddBtn label="+ Cyl"      title="Add Cylinder"       onClick={() => addCylinder(target)} />
          <AddBtn label="+ Sphere"   title="Add Sphere"         onClick={() => addSphere(target)} />
          <AddBtn label="+ Bool"     title="Add Boolean op"     onClick={() => addBoolean('subtract', target)} />
          <AddBtn label="+ Group"    title="Add Group"          onClick={() => addGroup(target)} />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {scene?.root && <OutlinerRow node={scene.root} depth={0} />}
      </div>
    </div>
  );
}
