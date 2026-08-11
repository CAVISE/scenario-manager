import { CARLA_MAPS } from '../../../SimConfigModal.constants';
export function toCarlaMapNameFromXodr(xodrName: string): string | null {
  const base = xodrName.replace(/\.xodr$/i, '');
  if (!base) return null;
  if (
    base.toLowerCase() === 'town10' ||
    base.toLowerCase() === 'town10hd_opt'
  ) {
    return 'Town10HD';
  }
  const withoutOpt = base.replace(/_Opt$/i, '');
  return CARLA_MAPS.includes(withoutOpt) ? withoutOpt : null;
}
