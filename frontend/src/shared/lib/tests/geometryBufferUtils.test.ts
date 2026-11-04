import { describe, expect, it } from 'vitest';
import {
  encodeIdRanges,
  filterValidPrimitives,
  sanitizePositionBuffer,
} from '../geometryBufferUtils';

describe('geometryBufferUtils', () => {
  it('keeps valid vertices and neutralizes non-finite coordinates', () => {
    const result = sanitizePositionBuffer([
      1,
      2,
      3,
      Number.NaN,
      4,
      5,
      6,
      Number.POSITIVE_INFINITY,
      7,
    ]);

    expect(Array.from(result.values)).toEqual([1, 2, 3, 0, 0, 0, 0, 0, 0]);
    expect(Array.from(result.validVertices)).toEqual([1, 0, 0]);
  });

  it('removes only primitives that reference invalid vertices', () => {
    const result = filterValidPrimitives(
      [0, 1, 2, 0, 2, 3, 0, 1, 9],
      new Uint8Array([1, 1, 1, 0]),
      3
    );

    expect(Array.from(result)).toEqual([0, 1, 2]);
  });

  it('encodes an id into each vertex belonging to its interval', () => {
    const ids = encodeIdRanges(3, new Uint32Array([258, 1, 3]));

    expect(ids).toEqual(
      new Float32Array([
        0,
        0,
        0,
        0,
        2 / 255,
        1 / 255,
        0,
        0,
        2 / 255,
        1 / 255,
        0,
        0,
      ])
    );
  });
});
