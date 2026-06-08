import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  setStoredXodrName,
  getStoredXodrName,
  fetchXodrText,
} from './xodrRepository';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

function okResponse(text: string) {
  return Promise.resolve({
    ok: true,
    text: () => Promise.resolve(text),
  } as Response);
}

function notFound() {
  return Promise.resolve({
    ok: false,
    text: () => Promise.resolve(''),
  } as Response);
}

const VALID_OPENDRIVE = '<?xml version="1.0"?>\n<OpenDRIVE>\n</OpenDRIVE>';

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe('setStoredXodrName', () => {
  it('stores name with .xodr extension', () => {
    const result = setStoredXodrName('Town10HD');
    expect(result).toBe('Town10HD.xodr');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cached_xodr',
      'Town10HD.xodr',
    );
  });

  it('does not double-add .xodr if already present', () => {
    const result = setStoredXodrName('Town03.xodr');
    expect(result).toBe('Town03.xodr');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cached_xodr',
      'Town03.xodr',
    );
  });

  it('falls back to data.xodr for raw XML content', () => {
    const result = setStoredXodrName('<OpenDRIVE></OpenDRIVE>');
    expect(result).toBe('data.xodr');
  });

  it('falls back to data.xodr for empty string', () => {
    const result = setStoredXodrName('');
    expect(result).toBe('data.xodr');
  });
});

describe('getStoredXodrName', () => {
  it('returns stored value with .xodr extension', () => {
    localStorageMock.setItem('cached_xodr', 'Town02');
    expect(getStoredXodrName()).toBe('Town02.xodr');
  });

  it('returns stored value unchanged when already has .xodr', () => {
    localStorageMock.setItem('cached_xodr', 'Town06.xodr');
    expect(getStoredXodrName()).toBe('Town06.xodr');
  });

  it('uses fallback when localStorage is empty', () => {
    expect(getStoredXodrName('Town10HD')).toBe('Town10HD.xodr');
  });

  it('uses data.xodr when localStorage is empty and no fallback given', () => {
    expect(getStoredXodrName()).toBe('data.xodr');
  });

  it('ignores stored raw XML and uses fallback', () => {
    localStorageMock.setItem('cached_xodr', '<OpenDRIVE>\n</OpenDRIVE>');
    expect(getStoredXodrName('Town01')).toBe('data.xodr');
  });
});

describe('fetchXodrText', () => {
  it('returns text when first candidate responds with valid OpenDRIVE', async () => {
    fetchMock.mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    const result = await fetchXodrText('Town03');
    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenCalledWith('./Town03.xodr');
  });

  it('tries _Opt variant when primary candidate is not found', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    const result = await fetchXodrText('Town03');
    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenNthCalledWith(1, './Town03.xodr');
    expect(fetchMock).toHaveBeenNthCalledWith(2, './Town03_Opt.xodr');
  });

  it('resolves aliases for town10 → Town10HD', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    const result = await fetchXodrText('town10');
    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenCalledWith('./Town10HD.xodr');
  });

  it('falls back to data.xodr as last resort', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    await fetchXodrText('UnknownMap');
    const calls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('./data.xodr');
  });

  it('throws when no candidate returns valid OpenDRIVE', async () => {
    fetchMock.mockResolvedValue(notFound() as never);
    await expect(fetchXodrText('NoMap')).rejects.toThrow(
      'Failed to load valid OpenDRIVE map for: NoMap',
    );
  });

  it('skips response that is not valid OpenDRIVE XML', async () => {
    fetchMock
      .mockResolvedValueOnce(okResponse('not xml at all') as never)
      .mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    const result = await fetchXodrText('Town01');
    expect(result).toBe(VALID_OPENDRIVE);
  });

  it('accepts OpenDRIVE tag with attributes', async () => {
    const xml = '<OpenDRIVE version="1.4">\n</OpenDRIVE>';
    fetchMock.mockResolvedValue(okResponse(xml) as never);
    const result = await fetchXodrText('Town01');
    expect(result).toBe(xml);
  });
  it('buildCandidates handles name without extension internally', async () => {
    fetchMock.mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    await fetchXodrText('Town01');
    expect(fetchMock).toHaveBeenCalledWith('./Town01.xodr');
  });
});
