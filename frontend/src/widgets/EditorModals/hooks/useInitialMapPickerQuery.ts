import { useEffect } from 'react';

export function useInitialMapPickerQuery() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mapPicker') !== '1') return;

    params.delete('mapPicker');
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
  }, []);
}
