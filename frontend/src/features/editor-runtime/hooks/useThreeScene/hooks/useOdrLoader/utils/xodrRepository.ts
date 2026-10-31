const XODR_EXT = '.xodr';

/**
 * A map can use distinct source assets in the editor and in each simulator.
 * Adding a simulator integration means extending this profile, not adding an
 * exception to a launch handler.  If a profile is absent, the map is treated
 * as a one-file map and its editor asset is used for every target.
 */
export type MapTarget = 'carla' | 'sumo' | 'artery' | 'omnet' | 'sionna';

export type MapAssetProfile = {
  /** Stable logical name; file names may change without changing the profile. */
  id: string;
  editorXodr: string;
  /** Assets whose geometry is in the same declared editor coordinate frame. */
  targets: Partial<Record<MapTarget, { xodr: string }>>;
};

export const MAP_ASSET_PROFILES: readonly MapAssetProfile[] = [
  {
    id: 'osm-area',
    editorXodr: 'osm-area.viewer.xodr',
    targets: {
      carla: { xodr: 'osm-area.xodr' },
    },
  },
  {
    id: 'osm-area-20261021',
    editorXodr: 'osm-area-20261021.viewer.xodr',
    targets: {
      carla: { xodr: 'osm-area-20261021.xodr' },
    },
  },
  {
    id: 'osm-area-20261030-certified',
    editorXodr: 'osm-area-20261030-certified.viewer.xodr',
    targets: {
      carla: { xodr: 'osm-area-20261030-certified.xodr' },
    },
  },
  {
    id: 'strogino-smoke-certified',
    editorXodr: 'strogino-smoke-certified.viewer.xodr',
    targets: {
      carla: { xodr: 'strogino-smoke-certified.xodr' },
    },
  },
  {
    id: 'strogino',
    editorXodr: 'strogino_modified_viewer.xodr',
    targets: {
      carla: { xodr: 'strogino_modified.xodr' },
    },
  },
];
import { CACHE_KEY } from '../../../constants/openDriveConstants';
import { readXodrFromIndexedDb, writeXodrToIndexedDb } from './xodrIndexedDb';
const MAP_NAME_KEY = 'cached_xodr_name';
const LEGACY_CONTENT_CACHE_KEY = 'cached_xodr_content';
export const DEFAULT_XODR = 'data.xodr';
export const LARGE_XODR = 'osm-area-20261021.viewer.xodr';

const CARLA_MAPS = [
  'Town01',
  'Town02',
  'Town03',
  'Town04',
  'Town05',
  'Town06',
  'Town07',
  'Town10HD',
  'Town10HD_Opt',
  'TownBig',
  'osm-area.viewer',
  'osm-area-20261021.viewer',
  'osm-area-valid-20261029',
  'osm-area-20261030-certified.viewer',
  'strogino_modified_viewer',
  'strogino-valid-20261029',
  'strogino-smoke-certified.viewer',
] as const;

function generateMapAliases(): Record<string, string[]> {
  const aliases: Record<string, string[]> = {};

  for (const map of CARLA_MAPS) {
    const lower = map.toLowerCase();

    const base = map.replace('_Opt', '');
    if (!aliases[lower]) {
      aliases[lower] = [];
    }
    aliases[lower].push(map);

    if (map !== base && !aliases[base.toLowerCase()]) {
      aliases[base.toLowerCase()] = [base];
    }
  }

  return aliases;
}

const MAP_ALIASES = generateMapAliases();

let cachedXodrContent: string | null = null;

// Browsers commonly cap localStorage at about 5 MB. Large OpenDRIVE exports
// are kept in IndexedDB instead, which is designed for this amount of data.
const LOCAL_STORAGE_MAX_CHARS = 2 * 1024 * 1024;

export async function initXodrCacheFromIndexedDb(): Promise<void> {
  if (cachedXodrContent) return;
  const stored = await readXodrFromIndexedDb();
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

/**
 * Resolves a target-specific map asset.  With no target profile, the existing
 * editor XODR is retained for backward compatibility with one-file maps.
 */
export function getTargetXodrName(
  editorMapName: string,
  target: MapTarget
): string {
  const normalized = withXodrExtension(editorMapName);
  const profile = MAP_ASSET_PROFILES.find(
    (item) =>
      item.editorXodr.toLowerCase() === normalized.toLowerCase() ||
      item.id.toLowerCase() === stripExt(normalized).toLowerCase()
  );
  return profile?.targets[target]?.xodr ?? normalized;
}

/** Backward-compatible CARLA-specific name used by the execution workflow. */
export function getRuntimeXodrName(editorMapName: string): string {
  return getTargetXodrName(editorMapName, 'carla');
}

function normalizeMapName(mapName: string): string {
  const lower = mapName.toLowerCase().replace('.xodr', '');

  for (const map of CARLA_MAPS) {
    if (
      map.toLowerCase() === lower ||
      map.toLowerCase() === lower.replace('_opt', '')
    ) {
      return map;
    }
  }

  return mapName;
}

function buildCandidates(mapName: string): string[] {
  const normalized = withXodrExtension(mapName);
  const base = stripExt(normalized);
  const lowerBase = base.toLowerCase();

  const aliases = MAP_ALIASES[lowerBase] ?? [];
  const candidates = [
    normalized,
    `${base}_Opt${XODR_EXT}`,
    ...aliases.map((name) => withXodrExtension(name)),
    DEFAULT_XODR,
  ];

  for (const map of CARLA_MAPS) {
    if (map.toLowerCase() === lowerBase) continue;
    candidates.push(withXodrExtension(map));
  }

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

export function clearStoredXodrName(): void {
  localStorage.removeItem(MAP_NAME_KEY);
}

export function getStoredXodrName(fallbackMapName?: string): string {
  const storedName = localStorage.getItem(MAP_NAME_KEY);
  if (storedName?.trim()) return withXodrExtension(storedName);

  const stored = localStorage.getItem(CACHE_KEY);
  if (stored?.trim() && !isOpenDrive(stored)) {
    return withXodrExtension(stored);
  }

  const fallback = fallbackMapName ?? 'Town10HD';
  const normalized = normalizeMapName(fallback);
  return withXodrExtension(normalized);
}

export function isLargeXodrSelected(): boolean {
  return getStoredXodrName() === LARGE_XODR;
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

/** Loads one named map only; paired runtime maps must not fall back to another asset. */
async function fetchExactXodrText(mapName: string): Promise<string> {
  const normalized = withXodrExtension(mapName);
  const response = await fetch(`./${normalized}`);
  if (!response.ok) {
    throw new Error(`Failed to load runtime OpenDRIVE map: ${normalized}`);
  }

  const text = await response.text();
  if (!isOpenDrive(text)) {
    throw new Error(`Runtime map is not valid OpenDRIVE: ${normalized}`);
  }
  return text;
}

export function getCachedXodrContent(): string | null {
  if (cachedXodrContent) return cachedXodrContent;

  const stored =
    localStorage.getItem(CACHE_KEY) ??
    localStorage.getItem(LEGACY_CONTENT_CACHE_KEY);
  if (stored && isOpenDrive(stored)) return stored;

  return null;
}

export function setCachedCustomXodrContent(content: string): void {
  cachedXodrContent = content;
  if (content.length <= LOCAL_STORAGE_MAX_CHARS) {
    try {
      localStorage.setItem(CACHE_KEY, content);
    } catch (error) {
      console.warn('Failed to cache OpenDRIVE map in localStorage.', error);
    }
  } else {
    localStorage.removeItem(CACHE_KEY);
  }
  void writeXodrToIndexedDb(content);
}

export async function resolveXodrTextForSimulation(
  fallbackMapName?: string
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

/**
 * Resolves the XODR for execution.  When an editor/runtime pair is configured,
 * do not return the editor's cache: it belongs to the viewer map, not CARLA.
 */
export async function resolveRuntimeXodrTextForSimulation(
  editorMapName?: string
): Promise<string | undefined> {
  const resolvedEditorMap = getStoredXodrName(editorMapName);
  const runtimeMap = getRuntimeXodrName(resolvedEditorMap);

  if (runtimeMap !== resolvedEditorMap) {
    try {
      return await fetchExactXodrText(runtimeMap);
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  return resolveXodrTextForSimulation(resolvedEditorMap);
}

let preloadPromise: Promise<void> | null = null;

export function preloadXodrText(fallbackMapName?: string): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    await initXodrCacheFromIndexedDb();
    if (getCachedXodrContent()) return;

    try {
      const mapName = getStoredXodrName(fallbackMapName);
      const text = await fetchXodrText(mapName);
      setCachedCustomXodrContent(text);
    } catch (error) {
      console.warn('[xodrRepository] map preload failed', error);
    }
  })();

  return preloadPromise;
}

export { CARLA_MAPS, normalizeMapName };
