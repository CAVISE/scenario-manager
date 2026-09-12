import React from 'react';

type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';

interface CornerProps {
  pos: CornerPosition;
}

export const Corner: React.FC<CornerProps> = ({ pos }) => (
  <div className={`sm-home-corner sm-home-corner-${pos}`} />
);
