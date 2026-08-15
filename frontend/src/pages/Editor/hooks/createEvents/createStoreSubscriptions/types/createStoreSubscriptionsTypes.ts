export interface CreateStoreSubscriptionsOptions {
  getIsDragging: () => boolean;
  loadPoints: () => void;
  updateSceneGraph: () => void;
}
