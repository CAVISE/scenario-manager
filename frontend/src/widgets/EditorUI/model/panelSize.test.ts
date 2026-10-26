import { describe, expect, it } from 'vitest';
import { clampPanelWidth } from './panelSize';

describe('clampPanelWidth', () => {
  it('keeps resizable editor panels within usable bounds', () => {
    expect(clampPanelWidth(120)).toBe(200);
    expect(clampPanelWidth(330)).toBe(330);
    expect(clampPanelWidth(700)).toBe(520);
  });
});
