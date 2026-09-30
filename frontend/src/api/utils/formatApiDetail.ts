import type { ValidationIssue } from '../types/IScenarioTypes';

export function formatApiDetail(
  detail: string | ValidationIssue[] | undefined
): string | null {
  if (!detail) return null;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const lines = detail
      .map((issue) => {
        const path = issue.loc
          ?.filter((part: string | number) => part !== 'body')
          .join('.');
        const message = issue.msg ?? 'Validation error';
        return path ? `${path}: ${message}` : message;
      })
      .filter(Boolean);
    return lines.length > 0 ? lines.join('; ') : null;
  }
  return null;
}
