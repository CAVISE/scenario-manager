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
});
