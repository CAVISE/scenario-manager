import { HTTPError } from 'ky';

type ValidationIssue = {
  msg?: string;
  loc?: (string | number)[];
};

type ApiErrorPayload =
  | {
      detail?: string | ValidationIssue[];
      message?: string;
      error?: string;
    }
  | string
  | null
  | undefined;

function formatApiDetail(
  detail: string | ValidationIssue[] | undefined,
): string | null {
  if (!detail) return null;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const lines = detail
      .map((issue) => {
        const path = issue.loc
          ?.filter((part: string | number) => part !== 'body')
          .join('.');
        const msg = issue.msg ?? 'Validation error';
        return path ? `${path}: ${msg}` : msg;
      })
      .filter(Boolean);
    return lines.length > 0 ? lines.join('; ') : null;
  }
  return null;
}

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
