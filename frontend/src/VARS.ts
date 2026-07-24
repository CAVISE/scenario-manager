function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();
  if (configured) {
    return configured.endsWith('/') ? configured : `${configured}/`;
  }
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }
  return 'http://localhost:8000/';
}

export const API_URL = resolveApiUrl();
