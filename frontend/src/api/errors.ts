import { HTTPError } from 'ky';
import { ApiErrorPayload, formatApiDetail } from './types/IScenarioTypes';

export async function getApiErrorMessage(
  err: unknown,
  fallback: string,
): Promise<string> {
  if (err instanceof HTTPError) {
    try {
      const payload = (await err.response.json()) as ApiErrorPayload;
      if (typeof payload === 'string' && payload.trim()) return payload;
      if (payload && typeof payload === 'object') {
        const fromDetail = formatApiDetail(payload.detail);
        if (fromDetail) return fromDetail;
        const message = payload.message || payload.error;
        if (message && message.trim()) return message;
      }
    } catch (e) {
      console.error('Failed to parse error response:', e);
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
