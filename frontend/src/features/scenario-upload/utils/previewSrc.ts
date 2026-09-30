export function getScenarioPreviewSrc(
  preview: string | null
): string | undefined {
  if (!preview) return undefined;

  if (
    preview.startsWith('data:') ||
    preview.startsWith('http://') ||
    preview.startsWith('https://') ||
    preview.startsWith('/')
  ) {
    return preview;
  }

  return `data:image/png;base64,${preview}`;
}
