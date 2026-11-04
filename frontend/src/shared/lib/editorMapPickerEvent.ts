export const OPEN_MAP_PICKER_EVENT = 'editor-open-map-picker';

export function openMapPicker() {
  window.dispatchEvent(new Event(OPEN_MAP_PICKER_EVENT));
}
