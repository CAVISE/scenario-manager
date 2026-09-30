import React from 'react';
import { formatCoord } from '../utils/coordinateHelpers';
import { CarlaCoordinates } from './CarlaCoordinates';
import { CoordinatesDisplayProps } from '../types/CoordinateWidgetTypes';

export const CoordinatesDisplay: React.FC<CoordinatesDisplayProps> = ({
  coords,
  onMap,
  offset,
}) => {
  return (
    <>
      Editor X <b>{formatCoord(coords.x)}</b>
      {' Y '}
      <b>{formatCoord(coords.y)}</b>
      {' Z '}
      <b>{formatCoord(coords.z)}</b>
      {onMap && (
        <CarlaCoordinates
          x={coords.x}
          y={coords.y}
          z={coords.z}
          offset={offset}
        />
      )}
    </>
  );
};
