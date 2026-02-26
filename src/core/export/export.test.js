/**
 * Tests for export dimension calculations.
 * These run in jsdom and do NOT trigger actual file downloads.
 */

import { describe, it, expect } from 'vitest';
import { presetPx, UNIT_PX } from '../model/projectModel.js';
import { generateSVG }       from './SVGExporter.js';
import { createDefaultProject } from '../model/projectModel.js';

describe('Export dimension calculation', () => {
  it('PNG 2× dimensions equal 2 * UNIT_PX for 1u', () => {
    const { w, h } = presetPx('1u', 2);
    expect(w).toBe(UNIT_PX * 2);
    expect(h).toBe(UNIT_PX * 2);
  });

  it('PNG 4× dimensions equal 4 * UNIT_PX for 1u', () => {
    const { w, h } = presetPx('1u', 4);
    expect(w).toBe(UNIT_PX * 4);
    expect(h).toBe(UNIT_PX * 4);
  });

  it('2u preset is twice as wide as 1u at same scale', () => {
    const u1 = presetPx('1u', 2);
    const u2 = presetPx('2u', 2);
    expect(u2.w).toBe(u1.w * 2);
    expect(u2.h).toBe(u1.h);
  });

  it('exported dimensions match preset physW proportions', () => {
    // widthUnits ratio should be preserved at all scales
    const s1_1u  = presetPx('1u',    1).w;
    const s1_2u  = presetPx('2u',    1).w;
    const s1_15u = presetPx('1.5u',  1).w;
    expect(s1_2u  / s1_1u ).toBeCloseTo(2,    1);
    expect(s1_15u / s1_1u ).toBeCloseTo(1.5,  1);
  });
});

describe('SVG generation', () => {
  it('generates valid SVG string', () => {
    const project = createDefaultProject();
    const svg = generateSVG(project);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('SVG width/height match preset pixel dimensions', () => {
    const project = createDefaultProject();
    const { w, h } = presetPx('1u', 1);
    const svg = generateSVG(project);
    expect(svg).toContain(`width="${w}"`);
    expect(svg).toContain(`height="${h}"`);
  });

  it('SVG contains legend text when main legend enabled', () => {
    const project = createDefaultProject();
    project.legends.main.text = 'Z';
    const svg = generateSVG(project);
    expect(svg).toContain('>Z<');
  });

  it('SVG does not contain legend text for disabled legends', () => {
    const project = createDefaultProject();
    project.legends.topLeft.enabled = false;
    project.legends.topLeft.text    = 'ShouldNotAppear';
    const svg = generateSVG(project);
    expect(svg).not.toContain('ShouldNotAppear');
  });

  it('transparent background omits fill on rect', () => {
    const project = createDefaultProject();
    const svg = generateSVG(project, true);
    expect(svg).toContain('fill="none"');
    expect(svg).not.toContain(`fill="${project.keycap.bgColor}"`);
  });

  it('opaque background includes fill on rect', () => {
    const project = createDefaultProject();
    project.keycap.bgColor = '#abcdef';
    const svg = generateSVG(project, false);
    expect(svg).toContain(`fill="#abcdef"`);
  });

  it('outline disabled produces stroke="none"', () => {
    const project = createDefaultProject();
    project.keycap.outlineEnabled = false;
    const svg = generateSVG(project);
    expect(svg).toContain('stroke="none"');
  });

  it('escapes special characters in legend text', () => {
    const project = createDefaultProject();
    project.legends.main.text = '<Esc>';
    const svg = generateSVG(project);
    expect(svg).toContain('&lt;Esc&gt;');
    expect(svg).not.toContain('<Esc>');
  });
});
