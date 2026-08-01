const XODR_EXT = '.xodr';
const CACHE_KEY = 'cached_xodr';
const MAP_NAME_KEY = 'cached_xodr_name';
const LEGACY_CONTENT_KEY = 'cached_xodr_content';
const DEFAULT_XODR = 'data.xodr';
const MAP_ALIASES: Record<string, string[]> = {
  town10: ['Town10HD', 'Town10HD_Opt'],
  town10hd: ['Town10HD', 'Town10HD_Opt'],
};
let cachedXodrContent: string | null = null;

const IDB_NAME = 'scenario-manager-xodr-cache';
const IDB_STORE = 'xodr';
const IDB_VERSION = 1;

function openXodrCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGetXodrContent(): Promise<string | null> {
  try {
    const db = await openXodrCacheDb();
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(CACHE_KEY);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('Failed to read cached OpenDRIVE map from IndexedDB.', error);
    return null;
  }
}

async function idbSetXodrContent(content: string): Promise<void> {
  try {
    const db = await openXodrCacheDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(content, CACHE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Failed to persist cached OpenDRIVE map to IndexedDB.', error);
  }
}

export async function initXodrCacheFromIndexedDb(): Promise<void> {
  if (cachedXodrContent) return;
  const stored = await idbGetXodrContent();
  if (stored && isOpenDrive(stored)) cachedXodrContent = stored;
}

function withXodrExtension(value: string): string {
  const normalized = value.trim();
  if (
    !normalized ||
    normalized.includes('<') ||
    normalized.includes('>') ||
    normalized.includes('\n') ||
    normalized.includes('\r')
  ) {
    return DEFAULT_XODR;
  }
  return normalized.toLowerCase().endsWith(XODR_EXT)
    ? normalized
    : `${normalized}${XODR_EXT}`;
}

function stripExt(value: string): string {
  return value.toLowerCase().endsWith(XODR_EXT)
    ? value.slice(0, -XODR_EXT.length)
    : value;
}

function buildCandidates(mapName: string): string[] {
  const normalized = withXodrExtension(mapName);
  const base = stripExt(normalized);
  const aliases = MAP_ALIASES[base.toLowerCase()] ?? [];
  const candidates = [
    normalized,
    `${base}_Opt${XODR_EXT}`,
    ...aliases.map((name) => withXodrExtension(name)),
    DEFAULT_XODR,
  ];
  return [...new Set(candidates)];
}

export function isOpenDrive(text: string): boolean {
  return /<\s*OpenDRIVE[\s>]/i.test(text);
}

export function setStoredXodrName(mapName: string): string {
  const normalized = withXodrExtension(mapName);
  localStorage.setItem(MAP_NAME_KEY, normalized);
  return normalized;
}

export function getStoredXodrName(fallbackMapName?: string): string {
  const storedName = localStorage.getItem(MAP_NAME_KEY);
  if (storedName?.trim()) return withXodrExtension(storedName);

  const stored = localStorage.getItem(CACHE_KEY);
  if (stored?.trim() && !isOpenDrive(stored)) {
    return withXodrExtension(stored);
  }
  return withXodrExtension(fallbackMapName ?? 'data.xodr');
}

export async function fetchXodrText(mapName: string): Promise<string> {
  const candidates = buildCandidates(mapName);
  for (const candidate of candidates) {
    const response = await fetch(`./${candidate}`);
    if (!response.ok) continue;
    const text = await response.text();
    if (isOpenDrive(text)) return text;
  }
  throw new Error(`Failed to load valid OpenDRIVE map for: ${mapName}`);
}

export function getCachedXodrContent(): string | null {
  if (cachedXodrContent) return cachedXodrContent;

  const stored = localStorage.getItem(CACHE_KEY);
  if (stored && isOpenDrive(stored)) return stored;

  const legacyContent = localStorage.getItem(LEGACY_CONTENT_KEY);
  if (legacyContent && isOpenDrive(legacyContent)) return legacyContent;
  return null;
}

export function setCachedCustomXodrContent(content: string): void {
  cachedXodrContent = content;
  try {
    localStorage.setItem(CACHE_KEY, content);
    localStorage.removeItem(LEGACY_CONTENT_KEY);
  } catch (error) {
    console.warn('OpenDRIVE map is too large for localStorage.', error);
  }
  void idbSetXodrContent(content);
}

export async function resolveXodrTextForSimulation(
  fallbackMapName?: string,
): Promise<string | undefined> {
  const cached = getCachedXodrContent();
  if (cached) return cached;

  try {
    return await fetchXodrText(getStoredXodrName(fallbackMapName));
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
