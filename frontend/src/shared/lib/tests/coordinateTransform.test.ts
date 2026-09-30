import { describe, expect, it } from 'vitest';
import { carlaToEditor, editorToCarla } from '../coordinateTransform';

const offsets = { x: -8.377, y: -28.583 };

describe('coordinateTransform', () => {
  it('round-trips editor ↔ CARLA', () => {
    const carla = editorToCarla(10.5, -31.27, 0.2, offsets);
    expect(carla.x).toBeCloseTo(2.123, 2);
    expect(carla.y).toBeCloseTo(2.687, 2);

    const back = carlaToEditor(carla.x, carla.y, carla.z, offsets);
    expect(back.x).toBeCloseTo(10.5, 4);
    expect(back.y).toBeCloseTo(-31.27, 4);
  });

  it('covers editorToCarla: z + 1 when isSpawn is true', () => {
    const result = editorToCarla(1, 2, 3, offsets, true);
    expect(result.z).toBe(4);
  });

  it('covers editorToCarla: z = 0 when isSpawn is false', () => {
    const result = editorToCarla(1, 2, 3, offsets, false);
    expect(result.z).toBe(0);
  });

  it('covers editorToCarla: isSpawn defaults to true', () => {
    const result = editorToCarla(1, 2, 3, offsets);
    expect(result.z).toBe(4);
  });

  it('covers editorToCarla: x transformation with offsets', () => {
    const result = editorToCarla(10, 20, 0, offsets);
    expect(result.x).toBe(10 + offsets.x);
  });

  it('covers editorToCarla: y transformation with offsets', () => {
    const result = editorToCarla(10, 20, 0, offsets);
    expect(result.y).toBe(-20 + offsets.y);
  });

  it('covers editorToCarla: with positive y', () => {
    const result = editorToCarla(5, 15, 0, offsets);
    expect(result.y).toBe(-15 + offsets.y);
  });

  it('covers editorToCarla: with negative y', () => {
    const result = editorToCarla(5, -15, 0, offsets);
    expect(result.y).toBe(15 + offsets.y);
  });

  it('covers carlaToEditor: x transformation with offsets', () => {
    const carlaX = 10;
    const result = carlaToEditor(carlaX, 0, 0, offsets);
    expect(result.x).toBe(carlaX - offsets.x);
  });

  it('covers carlaToEditor: y transformation with offsets', () => {
    const carlaY = 20;
    const result = carlaToEditor(0, carlaY, 0, offsets);
    expect(result.y).toBe(-(carlaY - offsets.y));
  });

  it('covers carlaToEditor: z transformation', () => {
    const carlaZ = 5;
    const result = carlaToEditor(0, 0, carlaZ, offsets);
    expect(result.z).toBe(carlaZ);
  });

  it('covers carlaToEditor: with positive y', () => {
    const result = carlaToEditor(0, 15, 0, offsets);
    expect(result.y).toBe(-(15 - offsets.y));
  });

  it('covers carlaToEditor: with negative y', () => {
    const result = carlaToEditor(0, -15, 0, offsets);
    expect(result.y).toBe(-(-15 - offsets.y));
  });

  it('covers round-trip with isSpawn false', () => {
    const carla = editorToCarla(10.5, -31.27, 0.2, offsets, false);
    const back = carlaToEditor(carla.x, carla.y, carla.z, offsets);
    expect(back.x).toBeCloseTo(10.5, 4);
    expect(back.y).toBeCloseTo(-31.27, 4);
    expect(back.z).toBe(0);
  });

  it('covers round-trip with different z values', () => {
    const zValues = [0, 1, 2.5, 10, -5];
    zValues.forEach((z) => {
      const carla = editorToCarla(1, 2, z, offsets, true);
      const back = carlaToEditor(carla.x, carla.y, carla.z, offsets);
      expect(back.z).toBe(z + 1);
    });
  });

  it('covers round-trip with negative coordinates', () => {
    const carla = editorToCarla(-10, -20, 0, offsets);
    const back = carlaToEditor(carla.x, carla.y, carla.z, offsets);
    expect(back.x).toBeCloseTo(-10, 4);
    expect(back.y).toBeCloseTo(-20, 4);
  });

  it('covers round-trip with large offsets', () => {
    const largeOffsets = { x: 1000, y: -2000 };
    const carla = editorToCarla(50, -50, 0, largeOffsets);
    const back = carlaToEditor(carla.x, carla.y, carla.z, largeOffsets);
    expect(back.x).toBeCloseTo(50, 4);
    expect(back.y).toBeCloseTo(-50, 4);
  });

  it('covers carlaToEditor with zero offsets', () => {
    const zeroOffsets = { x: 0, y: 0 };
    const result = carlaToEditor(10, 20, 5, zeroOffsets);
    expect(result.x).toBe(10);
    expect(result.y).toBe(-20);
    expect(result.z).toBe(5);
  });

  it('covers editorToCarla with zero offsets', () => {
    const zeroOffsets = { x: 0, y: 0 };
    const result = editorToCarla(10, 20, 3, zeroOffsets, true);
    expect(result.x).toBe(10);
    expect(result.y).toBe(-20);
    expect(result.z).toBe(4);
  });
});
