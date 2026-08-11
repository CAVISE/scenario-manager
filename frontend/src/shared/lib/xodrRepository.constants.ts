export const XODR_EXT = '.xodr';
export const XODR_CACHE_KEY = 'cached_xodr';
export const XODR_MAP_NAME_KEY = 'cached_xodr_name';
export const LEGACY_XODR_CONTENT_KEY = 'cached_xodr_content';
export const DEFAULT_XODR = 'data.xodr';

export const XODR_DATABASE_NAME = 'scenario-manager-xodr-cache';
export const XODR_DATABASE_STORE = 'xodr';
export const XODR_DATABASE_VERSION = 1;

export const CARLA_MAPS = [
  'Town01',
  'Town02',
  'Town03',
  'Town04',
  'Town05',
  'Town06',
  'Town07',
  'Town10HD',
  'Town10HD_Opt',
] as const;

function generateMapAliases(): Record<string, string[]> {
  const aliases: Record<string, string[]> = {};

  for (const map of CARLA_MAPS) {
    const lower = map.toLowerCase();
    const base = map.replace('_Opt', '');

    if (!aliases[lower]) aliases[lower] = [];
    aliases[lower].push(map);

    if (map !== base && !aliases[base.toLowerCase()]) {
      aliases[base.toLowerCase()] = [base];
    }
  }

  return aliases;
}

export const XODR_MAP_ALIASES = generateMapAliases();
