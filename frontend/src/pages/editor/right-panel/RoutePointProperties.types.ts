import { Point } from '../../../store/editor-store.types';

export interface RoutePointPropertiesProps {
  point: Point;
  onDelete: () => void;
}
