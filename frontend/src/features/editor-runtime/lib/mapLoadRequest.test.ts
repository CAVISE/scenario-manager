import { describe, expect, it } from 'vitest';
import { beginMapLoadRequest } from './mapLoadRequest';

describe('beginMapLoadRequest', () => {
  it('keeps only the latest map-loading operation current', () => {
    const first = beginMapLoadRequest();
    const second = beginMapLoadRequest();

    expect(first()).toBe(false);
    expect(second()).toBe(true);
  });
});
