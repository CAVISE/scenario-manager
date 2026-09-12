import React from 'react';

interface WidgetContainerProps {
  onMap: boolean;
  children: React.ReactNode;
}

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
