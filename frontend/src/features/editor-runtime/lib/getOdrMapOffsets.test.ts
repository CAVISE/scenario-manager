import { describe, expect, it } from 'vitest';

import { getOdrMapOffsets } from './getOdrMapOffsets';

describe('getOdrMapOffsets', () => {
  it('returns null when an Emscripten map object was already deleted', () => {
    const deletedMap = Object.defineProperties(
      {},
      {
        x_offs: {
          get: () => {
            throw new Error('deleted');
          },
        },
        y_offs: {
          get: () => {
            throw new Error('deleted');
          },
        },
      }
    );

    expect(getOdrMapOffsets(deletedMap as never)).toBeNull();
  });
});
