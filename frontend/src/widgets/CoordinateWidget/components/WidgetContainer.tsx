import React from 'react';
import type { WidgetContainerProps } from '../types/CoordinateWidgetTypes';

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  onMap,
  children,
}) => {
  return (
    <div className={`editor-coordinates${onMap ? ' on-map' : ''}`}>
      {children}
    </div>
  );
};
