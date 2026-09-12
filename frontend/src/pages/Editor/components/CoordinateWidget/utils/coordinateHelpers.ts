import { editorToCarla } from '@/helpers/coordinateTransform';
import { CarlaOffset } from '../types/CoordinateWidgetTypes';

export const COORD_PRECISION = 2;

export const formatCoord = (value: number): string =>
  value.toFixed(COORD_PRECISION);

export const toNDC = (clientX: number, clientY: number) => ({
  x: (clientX / window.innerWidth) * 2 - 1,
  y: -(clientY / window.innerHeight) * 2 + 1,
});

export const getCarlaCoords = (
  x: number,
  y: number,
  z: number,
  offset: CarlaOffset
) => editorToCarla(x, y, z, offset);
