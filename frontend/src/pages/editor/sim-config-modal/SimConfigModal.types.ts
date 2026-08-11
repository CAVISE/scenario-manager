import type { ReactNode } from 'react';

export interface SimConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export interface OpenCDACollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}
