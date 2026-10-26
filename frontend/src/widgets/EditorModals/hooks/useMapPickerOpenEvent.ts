import { useEffect } from 'react';
import { OPEN_MAP_PICKER_EVENT } from '@/shared/lib/editorMapPickerEvent';

export function useMapPickerOpenEvent(onOpen: () => void) {
  useEffect(() => {
    const openMapPicker = () => onOpen();
    window.addEventListener(OPEN_MAP_PICKER_EVENT, openMapPicker);
    return () =>
      window.removeEventListener(OPEN_MAP_PICKER_EVENT, openMapPicker);
  }, [onOpen]);
}
