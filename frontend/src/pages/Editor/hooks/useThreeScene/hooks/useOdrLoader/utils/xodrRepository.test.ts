import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedXodrContent,
  setStoredXodrName,
  getStoredXodrName,
  fetchXodrText,
  resolveXodrTextForSimulation,
  DEFAULT_XODR,
  normalizeMapName,
  CARLA_MAPS,
} from './xodrRepository';
import { MAP_PATH } from '../types/useOdrLoaderTypes';
describe('Module initialization - line 32 coverage', () => {
  it('covers line 32: MAP_ALIASES is generated on module import', () => {
    expect(CARLA_MAPS).toContain('Town10HD_Opt');
    expect(CARLA_MAPS).toContain('Town10HD');

    const optMaps = CARLA_MAPS.filter((map) => map.includes('_Opt'));
    expect(optMaps).toEqual(['Town10HD_Opt']);

    expect(normalizeMapName('Town10')).toBe('Town10');
    expect(normalizeMapName('Town10HD_Opt')).toBe('Town10HD');
  });
});
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

function createIndexedDbMock() {
  let stored: string | undefined;
  let shouldFailOpen = false;
  let shouldFailGet = false;
  let shouldFailPut = false;
  let triggerUpgrade = false;

  const fakeIndexedDb = {
    open: vi.fn(() => {
      const request: Partial<IDBOpenDBRequest> & {
        onupgradeneeded?: (() => void) | null;
        onsuccess?: (() => void) | null;
        onerror?: (() => void) | null;
      } = {};
      queueMicrotask(() => {
        if (shouldFailOpen) {
          (request as { error: Error }).error = new Error('open failed');
          request.onerror?.();
          return;
        }
        const containsStore = vi.fn(() => true);
        const fakeStore = {
          get: vi.fn(() => {
            const getRequest: Partial<IDBRequest> & {
              onsuccess?: (() => void) | null;
              onerror?: (() => void) | null;
              result?: unknown;
              error?: Error;
            } = {};
            queueMicrotask(() => {
              if (shouldFailGet) {
                getRequest.onerror?.();
                return;
              }
              getRequest.result = stored;
              getRequest.onsuccess?.();
            });
            return getRequest as IDBRequest;
          }),
          put: vi.fn((value: string) => {
            stored = value;
            const putRequest: Partial<IDBRequest> = {};
            return putRequest as IDBRequest;
          }),
        };
        const fakeTx: Partial<IDBTransaction> & {
          oncomplete?: (() => void) | null;
          onerror?: (() => void) | null;
          error?: Error;
        } = {
          objectStore: vi.fn(
            () => fakeStore
          ) as unknown as IDBTransaction['objectStore'],
        };
        const fakeDb: Partial<IDBDatabase> = {
          objectStoreNames: {
            contains: containsStore,
          } as unknown as DOMStringList,
          createObjectStore:
            vi.fn() as unknown as IDBDatabase['createObjectStore'],
          transaction: vi.fn(() => {
            queueMicrotask(() => {
              if (shouldFailPut) {
                fakeTx.onerror?.();
                return;
              }
              fakeTx.oncomplete?.();
            });
            return fakeTx as IDBTransaction;
          }) as unknown as IDBDatabase['transaction'],
        };
        (request as { result: IDBDatabase }).result = fakeDb as IDBDatabase;
        if (triggerUpgrade) {
          containsStore.mockReturnValue(false);
          request.onupgradeneeded?.();
          containsStore.mockReturnValue(true);
        }
        request.onsuccess?.();
      });
      return request as IDBOpenDBRequest;
    }),
  };

  return {
    fakeIndexedDb,
    setStoredValue: (value: string | undefined) => {
      stored = value;
    },
    setShouldFailOpen: (value: boolean) => {
      shouldFailOpen = value;
    },
    setShouldFailGet: (value: boolean) => {
      shouldFailGet = value;
    },
    setShouldFailPut: (value: boolean) => {
      shouldFailPut = value;
    },
    triggerUpgradeOnNextOpen: () => {
      triggerUpgrade = true;
    },
  };
}

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
      'cached_xodr_name',
      'Town10HD.xodr'
    );
  });

  it('does not double-add .xodr if already present', () => {
    const result = setStoredXodrName('Town03.xodr');
    expect(result).toBe('Town03.xodr');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'cached_xodr_name',
      'Town03.xodr'
    );
  });

  it('falls back to DEFAULT_XODR for raw XML content', () => {
    const result = setStoredXodrName('<OpenDRIVE></OpenDRIVE>');
    expect(result).toBe(DEFAULT_XODR);
  });

  it('falls back to DEFAULT_XODR for empty string', () => {
    const result = setStoredXodrName('');
    expect(result).toBe(DEFAULT_XODR);
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

  it('uses DEFAULT_XODR when localStorage is empty and no fallback given', () => {
    expect(getStoredXodrName()).toBe('Town10HD.xodr');
  });

  it('ignores stored raw XML and uses fallback', () => {
    localStorageMock.setItem('cached_xodr', '<OpenDRIVE>\n</OpenDRIVE>');
    expect(getStoredXodrName('Town01')).toBe('Town01.xodr');
  });
});

describe('getCachedXodrContent', () => {
  it('returns full OpenDRIVE content from cached_xodr', () => {
    localStorageMock.setItem('cached_xodr', VALID_OPENDRIVE);
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);
  });

  it('reads content stored by the transitional implementation', () => {
    localStorageMock.setItem('cached_xodr_content', VALID_OPENDRIVE);
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);
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
    expect(fetchMock).toHaveBeenCalledWith(MAP_PATH);
  });

  it('falls back to DEFAULT_XODR as last resort', async () => {
    fetchMock
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValueOnce(notFound() as never)
      .mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);
    await fetchXodrText('UnknownMap');
    const calls = fetchMock.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain(MAP_PATH);
  });

  it('throws when no candidate returns valid OpenDRIVE', async () => {
    fetchMock.mockResolvedValue(notFound() as never);
    await expect(fetchXodrText('NoMap')).rejects.toThrow(
      'Failed to load valid OpenDRIVE map for: NoMap'
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

describe('IndexedDB-backed cache for large maps', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function freshModule() {
    return await import('./xodrRepository');
  }

  it('setCachedCustomXodrContent still works when localStorage throws QuotaExceededError', async () => {
    const { setCachedCustomXodrContent, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb } = createIndexedDbMock();
    vi.stubGlobal('indexedDB', fakeIndexedDb);
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });

    expect(() => setCachedCustomXodrContent(VALID_OPENDRIVE)).not.toThrow();
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb restores content persisted by a previous session', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setStoredValue } = createIndexedDbMock();
    setStoredValue(VALID_OPENDRIVE);
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    expect(getCachedXodrContent()).toBeNull();

    await initXodrCacheFromIndexedDb();
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb does not restore content that fails the OpenDRIVE check', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setStoredValue } = createIndexedDbMock();
    setStoredValue('not valid opendrive content');
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    await initXodrCacheFromIndexedDb();
    expect(getCachedXodrContent()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb is a no-op when nothing was persisted', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb } = createIndexedDbMock();
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    await initXodrCacheFromIndexedDb();
    expect(getCachedXodrContent()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb resolves without throwing when IndexedDB is unavailable', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new Error('IndexedDB not supported in this environment');
      },
    });

    await expect(initXodrCacheFromIndexedDb()).resolves.toBeUndefined();
    expect(getCachedXodrContent()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb resolves without throwing when the DB open request errors out', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setShouldFailOpen } = createIndexedDbMock();
    setShouldFailOpen(true);
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    await expect(initXodrCacheFromIndexedDb()).resolves.toBeUndefined();
    expect(getCachedXodrContent()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('initXodrCacheFromIndexedDb resolves without throwing when the read transaction errors out', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setShouldFailGet } = createIndexedDbMock();
    setShouldFailGet(true);
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    await expect(initXodrCacheFromIndexedDb()).resolves.toBeUndefined();
    expect(getCachedXodrContent()).toBeNull();

    vi.unstubAllGlobals();
  });

  it('creates the object store on a first-time (upgrade-needed) database open', async () => {
    const { initXodrCacheFromIndexedDb, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setStoredValue, triggerUpgradeOnNextOpen } =
      createIndexedDbMock();
    setStoredValue(VALID_OPENDRIVE);
    triggerUpgradeOnNextOpen();
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    await initXodrCacheFromIndexedDb();
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);

    vi.unstubAllGlobals();
  });

  it('setCachedCustomXodrContent still resolves its background IndexedDB write when the write transaction errors out', async () => {
    const { setCachedCustomXodrContent, getCachedXodrContent } =
      await freshModule();
    const { fakeIndexedDb, setShouldFailPut } = createIndexedDbMock();
    setShouldFailPut(true);
    vi.stubGlobal('indexedDB', fakeIndexedDb);

    expect(() => setCachedCustomXodrContent(VALID_OPENDRIVE)).not.toThrow();
    expect(getCachedXodrContent()).toBe(VALID_OPENDRIVE);

    vi.unstubAllGlobals();
  });
});

describe('resolveXodrTextForSimulation', () => {
  it('returns the already-cached content without calling fetch', async () => {
    localStorageMock.setItem('cached_xodr', VALID_OPENDRIVE);

    const result = await resolveXodrTextForSimulation();

    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls back to fetching when nothing is cached, using the stored map name', async () => {
    localStorageMock.setItem('cached_xodr_name', 'Town04');
    fetchMock.mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);

    const result = await resolveXodrTextForSimulation();

    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenCalledWith('./Town04.xodr');
  });

  it('uses the given fallbackMapName when nothing is cached or stored', async () => {
    fetchMock.mockResolvedValue(okResponse(VALID_OPENDRIVE) as never);

    const result = await resolveXodrTextForSimulation('Town07');

    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenCalledWith('./Town07.xodr');
  });

  it('returns undefined and logs the error when fetchXodrText ultimately fails', async () => {
    fetchMock.mockResolvedValue(notFound() as never);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await resolveXodrTextForSimulation('NoSuchMap');

    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe('CARLA_MAPS and normalizeMapName', () => {
  it('contains Town10HD_Opt in CARLA_MAPS', () => {
    expect(CARLA_MAPS).toContain('Town10HD_Opt');
  });

  it('normalizeMapName returns Town10HD for Town10HD_Opt', () => {
    const result = normalizeMapName('Town10HD_Opt');
    expect(result).toBe('Town10HD');
  });

  it('normalizeMapName handles lowercase variants', () => {
    expect(normalizeMapName('town10hd_opt')).toBe('Town10HD');
    expect(normalizeMapName('town10hd')).toBe('Town10HD');
  });

  it('normalizeMapName returns original name for unknown maps', () => {
    expect(normalizeMapName('UnknownMap')).toBe('UnknownMap');
  });
});

describe('generateMapAliases - line 32 coverage', () => {
  it('covers line 32: creates alias for Town10HD_Opt', async () => {
    expect(CARLA_MAPS).toContain('Town10HD_Opt');

    const optMaps = CARLA_MAPS.filter((map) => map.includes('_Opt'));
    expect(optMaps).toEqual(['Town10HD_Opt']);

    const VALID_OPENDRIVE = '<?xml version="1.0"?>\n<OpenDRIVE>\n</OpenDRIVE>';
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve(''),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(VALID_OPENDRIVE),
      } as Response);

    const result = await fetchXodrText('Town10HD');

    expect(result).toBe(VALID_OPENDRIVE);
    expect(fetchMock).toHaveBeenNthCalledWith(1, './Town10HD.xodr');
    expect(fetchMock).toHaveBeenNthCalledWith(2, './Town10HD_Opt.xodr');

    vi.restoreAllMocks();
  });
});
