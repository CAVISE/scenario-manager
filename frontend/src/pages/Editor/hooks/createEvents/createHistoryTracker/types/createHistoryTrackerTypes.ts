export interface CreateHistoryTrackerOptions {
  getIsDragging: () => boolean;
}

export const HISTORY_COALESCE_MS = 500;
