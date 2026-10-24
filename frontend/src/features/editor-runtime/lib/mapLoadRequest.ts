let latestMapLoadRequest = 0;

export function beginMapLoadRequest(): () => boolean {
  const requestId = ++latestMapLoadRequest;
  return () => requestId === latestMapLoadRequest;
}
