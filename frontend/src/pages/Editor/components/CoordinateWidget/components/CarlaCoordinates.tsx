import React, { useMemo } from 'react';
import { formatCoord, getCarlaCoords } from '../utils/coordinateHelpers';
import { CarlaCoordinatesProps } from '../types/CoordinateWidgetTypes';

export const CarlaCoordinates: React.FC<CarlaCoordinatesProps> = ({
  x,
  y,
  z,
  offset,
}) => {
  const carla = useMemo(
    () => getCarlaCoords(x, y, z, offset),
    [x, y, z, offset]
  );

  return (
    <>
      {' | CARLA X '}
      <b>{formatCoord(carla.x)}</b>
      {' Y '}
      <b>{formatCoord(carla.y)}</b>
    </>
  );
};
