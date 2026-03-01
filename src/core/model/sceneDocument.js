/**
 * KeycapStudio – 3D Scene Document Model
 *
 * A "scene" is a node-based CSG tree.
 * File format: .kcs3d.json  (JSON, UTF-8)
 * Units: millimetres (mm)
 */

export const SCENE_VERSION = 1;
export const SCENE_FORMAT   = 'kcs3d';

/** All supported node types. */
export const NODE_TYPES = {
  PRIMITIVE : 'Primitive',
  BOOLEAN   : 'Boolean',
  GROUP     : 'Group',
  KEYCAP    : 'KeycapTemplate',
};

/** Supported primitive shapes. */
export const PRIMITIVES = ['box', 'cylinder', 'sphere'];

/** Default geometry params per primitive type (in mm). */
const PRIMITIVE_DEFAULTS = {
  box      : { width: 18, height: 11.5, depth: 18 },
  cylinder : { radiusTop: 9, radiusBottom: 9, height: 11.5, radialSegments: 32 },
  sphere   : { radius: 9, widthSegments: 32, heightSegments: 16 },
};

/** Supported boolean operations. */
export const BOOLEAN_OPS = ['subtract', 'union', 'intersect'];

// ─── ID generation ──────────────────────────────────────────────────────────

let _idCounter = 0;

/** Generate a short unique node ID (deterministic within a session). */
export function newId() {
  _idCounter += 1;
  return `n${_idCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Reset the id counter (useful in tests). */
export function resetIdCounter() { _idCounter = 0; }

// ─── Node factories ──────────────────────────────────────────────────────────

/**
 * Create a Primitive node.
 * @param {'box'|'cylinder'|'sphere'} primitive
 * @param {object} [overrides]
 */
export function createPrimitive(primitive = 'box', overrides = {}) {
  const defaults = PRIMITIVE_DEFAULTS[primitive] ?? PRIMITIVE_DEFAULTS.box;
  const { params: paramOverrides, material: materialOverrides, ...rest } = overrides;
  return {
    id       : newId(),
    type     : NODE_TYPES.PRIMITIVE,
    name     : primitive.charAt(0).toUpperCase() + primitive.slice(1),
    primitive,
    params   : { ...defaults, ...(paramOverrides ?? {}) },
    material : { color: '#cccccc', ...(materialOverrides ?? {}) },
    position : [0, 0, 0],
    rotation : [0, 0, 0],
    ...rest,
  };
}

/**
 * Create a KeycapTemplate node wrapping the existing keycap generator.
 * @param {object} [overrides]
 */
export function createKeycapNode(overrides = {}) {
  const { params: paramOverrides, ...rest } = overrides;
  return {
    id       : newId(),
    type     : NODE_TYPES.KEYCAP,
    name     : 'Keycap',
    params   : {
      profile      : 'Cherry',
      size         : '1u',
      color        : '#ffffff',
      hasStem      : true,
      topRadius    : 0.5,
      wallThickness: 1.5,
      height       : null,   // null → use profile default
      dishDepth    : null,   // null → use CHERRY_DISH_DEPTH (1.2 mm)
      ...(paramOverrides ?? {}),
    },
    position : [0, 0, 0],
    rotation : [0, 0, 0],
    ...rest,
  };
}

/**
 * Create a Boolean node (union / subtract / intersect).
 * @param {'subtract'|'union'|'intersect'} operation
 * @param {Array}  children  – inline child node objects
 * @param {object} [overrides]
 */
export function createBooleanNode(operation = 'subtract', children = [], overrides = {}) {
  return {
    id       : newId(),
    type     : NODE_TYPES.BOOLEAN,
    name     : `Boolean (${operation})`,
    operation,
    children : children,
    position : [0, 0, 0],
    rotation : [0, 0, 0],
    ...overrides,
  };
}

/**
 * Create a Group node.
 * @param {Array}  children
 * @param {object} [overrides]
 */
export function createGroupNode(children = [], overrides = {}) {
  return {
    id       : newId(),
    type     : NODE_TYPES.GROUP,
    name     : 'Group',
    children,
    position : [0, 0, 0],
    rotation : [0, 0, 0],
    ...overrides,
  };
}

// ─── Scene factory ───────────────────────────────────────────────────────────

/** Create a default scene with one KeycapTemplate node. */
export function createDefaultScene() {
  const keycap = createKeycapNode();
  const root   = createGroupNode([keycap], { id: 'root', name: 'Scene' });
  return {
    version: SCENE_VERSION,
    format : SCENE_FORMAT,
    name   : 'New Scene',
    root,
  };
}

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a raw parsed scene object.
 * Throws if fundamentally invalid.
 */
export function validateScene(raw) {
  if (!raw || typeof raw !== 'object')       throw new Error('Invalid scene: not an object');
  if (raw.format  !== SCENE_FORMAT)          throw new Error('Not a .kcs3d document');
  if (raw.version !== SCENE_VERSION)         throw new Error(`Unsupported scene version: ${raw.version}`);
  if (!raw.root   || typeof raw.root !== 'object') throw new Error('Invalid scene: missing root node');
  return raw;
}

// ─── Serialisation ───────────────────────────────────────────────────────────

/** Serialise a scene to a JSON string (for .kcs3d.json files). */
export function serialiseScene(scene) {
  return JSON.stringify(scene, null, 2);
}

/**
 * Deserialise a .kcs3d.json string.
 * @param {string} text
 * @returns validated scene object
 */
export function deserialiseScene(text) {
  let raw;
  try { raw = JSON.parse(text); }
  catch (e) { throw new Error('Invalid JSON in scene file'); }
  return validateScene(raw);
}

// ─── Tree helpers ────────────────────────────────────────────────────────────

/** Find a node by id anywhere in the tree. */
export function findNodeById(root, id) {
  if (!root)        return null;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/** Return a new tree with the node matching `id` replaced by { ...node, ...patch }. */
export function patchNodeById(root, id, patch) {
  if (!root) return root;
  if (root.id === id) return { ...root, ...patch };
  if (!root.children) return root;
  return { ...root, children: root.children.map(c => patchNodeById(c, id, patch)) };
}

/** Return a new tree with `child` appended to the node matching `parentId`. */
export function addChildById(root, parentId, child) {
  if (!root) return root;
  if (root.id === parentId) {
    return { ...root, children: [...(root.children ?? []), child] };
  }
  if (!root.children) return root;
  return { ...root, children: root.children.map(c => addChildById(c, parentId, child)) };
}

/** Return a new tree with the node matching `id` removed. */
export function removeNodeById(root, id) {
  if (!root?.children) return root;
  return {
    ...root,
    children: root.children
      .filter(c => c.id !== id)
      .map(c => removeNodeById(c, id)),
  };
}

/** Collect all nodes in the tree (depth-first). */
export function collectNodes(root, out = []) {
  if (!root) return out;
  out.push(root);
  for (const child of root.children ?? []) collectNodes(child, out);
  return out;
}
