import { ErrorLogEntry } from '@/store/types/useEditorStoreTypes';
import { SOURCE_LABEL } from '../types/ErrorLogModalTypes';

export function formatEntryForCopy(entry: ErrorLogEntry): string {
  const time = new Date(entry.timestamp).toISOString();
  const lines = [`[${time}] (${SOURCE_LABEL[entry.source]}) ${entry.message}`];
  if (entry.context) lines.push(`  context: ${entry.context}`);
  if (entry.stack) lines.push(entry.stack);
  return lines.join('\n');
}
