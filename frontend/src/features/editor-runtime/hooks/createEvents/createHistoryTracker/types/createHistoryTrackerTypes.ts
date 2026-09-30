export interface CreateHistoryTrackerOptions {
  getIsDragging: () => boolean;
}

export interface WithId {
  id: string;
}

export interface PendingEdit<T> {
  before: T;
  timer: ReturnType<typeof setTimeout>;
}
