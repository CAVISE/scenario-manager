import { HTTPError } from 'ky';

type ApiErrorPayload =
  | { detail?: string; message?: string; error?: string }
  | string
  | null
  | undefined;

export async function getApiErrorMessage(
  err: unknown,
  fallback: string,
): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const payload = (await err.response.json()) as ApiErrorPayload;
      if (typeof payload === 'string' && payload.trim()) return payload;
      if (payload && typeof payload === 'object') {
        const message = payload.detail || payload.message || payload.error;
        if (message && message.trim()) return message;
      }
    } catch {
      // ignore parse errors and fallback below
    }
    return fallback;
  }

  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export function getApiErrorMessageSync(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}
