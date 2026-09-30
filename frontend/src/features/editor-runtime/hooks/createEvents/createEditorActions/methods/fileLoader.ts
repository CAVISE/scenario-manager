import { FILE_ACCEPT } from '../constants/editorActions.constants';

export const loadFileFromInput = (
  onLoad: (content: string, clearMap: boolean, fileName: string) => void,
  accept: string = FILE_ACCEPT
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;

  input.addEventListener('change', (ev: Event) => {
    const target = ev.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onLoad(result, true, file.name);
      }
    };
    reader.onerror = () => {
      console.error('Failed to read file');
    };
    reader.readAsText(file);
  });

  input.click();
};
