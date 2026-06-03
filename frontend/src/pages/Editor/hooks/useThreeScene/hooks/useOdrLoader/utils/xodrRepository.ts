const XODR_EXT = '.xodr';
const CACHE_KEY = 'cached_xodr';
const XODR_CONTENT_KEY = 'cached_xodr_content';
const DEFAULT_XODR = 'data.xodr';
const MAP_ALIASES: Record<string, string[]> = {
  town10: ['Town10HD', 'Town10HD_Opt'],
  town10hd: ['Town10HD', 'Town10HD_Opt'],
};

function withXodrExtension(value: string): string {
  const normalized = value.trim();
  // Old localStorage might still contain raw XML, not map name.
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

function isOpenDrive(text: string): boolean {
  return /<\s*OpenDRIVE[\s>]/i.test(text);
}

export function setStoredXodrName(mapName: string): string {
  const normalized = withXodrExtension(mapName);
  localStorage.setItem(CACHE_KEY, normalized);
  return normalized;
}

export function getStoredXodrName(fallbackMapName?: string): string {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored?.trim()) return withXodrExtension(stored);
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

/** Map file name for DB `file_` (never full OpenDRIVE XML). */
export function getMapFileReference(fallbackMapName?: string): string {
  const stored = localStorage.getItem(CACHE_KEY);
  if (stored?.trim() && !isOpenDrive(stored) && !stored.includes('\n')) {
    return withXodrExtension(stored);
  }
  return getStoredXodrName(fallbackMapName);
}

export function setCachedCustomXodrContent(content: string): void {
  localStorage.setItem(XODR_CONTENT_KEY, content);
  localStorage.setItem(CACHE_KEY, DEFAULT_XODR);
}

/** OpenDRIVE XML for POST /api/start_opencda (`xodr` field). */
export async function resolveXodrTextForSimulation(
  fallbackMapName?: string,
): Promise<string | undefined> {
  const custom = localStorage.getItem(XODR_CONTENT_KEY);
  if (custom && isOpenDrive(custom)) return custom;

  const stored = localStorage.getItem(CACHE_KEY);
  if (stored && isOpenDrive(stored)) return stored;

  try {
    return await fetchXodrText(getStoredXodrName(fallbackMapName));
  } catch (e) {
    console.error(e);
    return undefined;
  }
}
