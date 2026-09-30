import type { Car, Lidar } from '@/entities/vehicle';

type BooleanSetter = (value: boolean) => void;

export interface CarSectionProps {
  car: Car;
}

export interface CarPropertiesProps {
  car: Car;
  carLidars?: Lidar[];
  onDelete?: () => void;
}

export interface CarBehaviorFlagsSectionProps extends CarSectionProps {
  showBehaviorFlags: boolean;
  setShowBehaviorFlags: BooleanSetter;
}

export interface CarBehaviorServicesSectionProps extends CarSectionProps {
  showBehaviorServices: boolean;
  setShowBehaviorServices: BooleanSetter;
}

export interface CarColorSectionProps extends CarSectionProps {
  showColor: boolean;
  setShowColor: BooleanSetter;
}

export interface CarIdentitySectionProps extends CarSectionProps {
  showName: boolean;
  setShowName: BooleanSetter;
  showId: boolean;
  setShowId: BooleanSetter;
}

export interface CarKinematicsSectionProps extends CarSectionProps {
  showMaxSpeed: boolean;
  setShowMaxSpeed: BooleanSetter;
  showCollisionAhead: boolean;
  setShowCollisionAhead: BooleanSetter;
}

export interface CarLocalPlannerDebugSectionProps extends CarSectionProps {
  showLocalPlanner: boolean;
  setShowLocalPlanner: BooleanSetter;
}

export interface CarModelSectionProps extends CarSectionProps {
  showModel: boolean;
  setShowModel: BooleanSetter;
}

export interface CarV2XSectionProps extends CarSectionProps {
  showV2x: boolean;
  setShowV2x: BooleanSetter;
}

export interface RgbEditorProps {
  color: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}
