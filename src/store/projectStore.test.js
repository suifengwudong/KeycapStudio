/**
 * Tests for projectStore – undo/redo behaviour.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub out autosave / localStorage before importing the store
vi.mock('../core/io/projectIO.js', () => ({
  writeAutosave: vi.fn(),
  readAutosave:  vi.fn(() => null),
  startAutosave: vi.fn(),
  clearAutosave: vi.fn(),
}));

// Dynamically import store AFTER mocks are in place
let useProjectStore;
beforeEach(async () => {
  vi.resetModules();
  const mod = await import('./projectStore.js');
  useProjectStore = mod.useProjectStore;
  // Reset store to a clean default state
  useProjectStore.getState().newProject();
});

function getState() { return useProjectStore.getState(); }

describe('projectStore – basic mutations', () => {
  it('starts with default project', () => {
    const { project } = getState();
    expect(project.keycap.preset).toBe('1u');
    expect(project.legends.main.enabled).toBe(true);
  });

  it('updateKeycap changes the keycap property', () => {
    getState().updateKeycap({ bgColor: '#ff0000' });
    expect(getState().project.keycap.bgColor).toBe('#ff0000');
  });

  it('updateLegend changes a legend property', () => {
    getState().updateLegend('main', { text: 'Ctrl' });
    expect(getState().project.legends.main.text).toBe('Ctrl');
  });

  it('marks isDirty after mutation', () => {
    expect(getState().isDirty).toBe(false);
    getState().updateKeycap({ bgColor: '#aaaaaa' });
    expect(getState().isDirty).toBe(true);
  });
});

describe('projectStore – undo/redo', () => {
  it('undo restores previous state', () => {
    const originalColor = getState().project.keycap.bgColor;
    getState().updateKeycap({ bgColor: '#123456' });
    expect(getState().project.keycap.bgColor).toBe('#123456');

    getState().undo();
    expect(getState().project.keycap.bgColor).toBe(originalColor);
  });

  it('redo reapplies undone state', () => {
    getState().updateKeycap({ bgColor: '#abcdef' });
    getState().undo();
    getState().redo();
    expect(getState().project.keycap.bgColor).toBe('#abcdef');
  });

  it('stacks multiple undo steps', () => {
    const orig = getState().project.keycap.bgColor;
    getState().updateKeycap({ bgColor: '#111111' });
    getState().updateKeycap({ bgColor: '#222222' });
    getState().updateKeycap({ bgColor: '#333333' });

    getState().undo(); // → #222222
    expect(getState().project.keycap.bgColor).toBe('#222222');
    getState().undo(); // → #111111
    expect(getState().project.keycap.bgColor).toBe('#111111');
    getState().undo(); // → orig
    expect(getState().project.keycap.bgColor).toBe(orig);
  });

  it('clears redo stack after a new mutation', () => {
    getState().updateKeycap({ bgColor: '#aaaaaa' });
    getState().undo();
    // New mutation should clear redo
    getState().updateKeycap({ bgColor: '#bbbbbb' });
    expect(getState().future).toHaveLength(0);
  });

  it('undo does nothing when there is no history', () => {
    expect(getState().past).toHaveLength(0);
    // Should not throw
    expect(() => getState().undo()).not.toThrow();
  });

  it('redo does nothing when future stack is empty', () => {
    expect(getState().future).toHaveLength(0);
    expect(() => getState().redo()).not.toThrow();
  });

  it('canUndo returns false on fresh project', () => {
    expect(getState().canUndo()).toBe(false);
  });

  it('canUndo returns true after a mutation', () => {
    getState().updateKeycap({ bgColor: '#eeeeee' });
    expect(getState().canUndo()).toBe(true);
  });

  it('canRedo returns true after undo', () => {
    getState().updateKeycap({ bgColor: '#eeeeee' });
    getState().undo();
    expect(getState().canRedo()).toBe(true);
  });
});

describe('projectStore – legend mutations', () => {
  it('enables a secondary legend', () => {
    getState().updateLegend('topLeft', { enabled: true, text: 'F1' });
    expect(getState().project.legends.topLeft.enabled).toBe(true);
    expect(getState().project.legends.topLeft.text).toBe('F1');
  });

  it('updates position correctly', () => {
    getState().updateLegend('main', { x: 0.1, y: -0.2 });
    const { x, y } = getState().project.legends.main;
    expect(x).toBeCloseTo(0.1);
    expect(y).toBeCloseTo(-0.2);
  });
});

describe('projectStore – newProject', () => {
  it('resets history on new project', () => {
    getState().updateKeycap({ bgColor: '#999999' });
    getState().newProject();
    expect(getState().past).toHaveLength(0);
    expect(getState().future).toHaveLength(0);
    expect(getState().isDirty).toBe(false);
  });
});
