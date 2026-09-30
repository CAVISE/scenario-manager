import type { RSU, RsuBehaviorService } from '@/entities/roadside-unit';

type BooleanSetter = (value: boolean) => void;

export interface RSUSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
}

export interface RSUPropertiesProps {
  rsu: RSU;
  onDelete: () => void;
}

export type PositionSectionProps = RSUSectionProps;
export type ScriptSectionProps = RSUSectionProps;
export type V2XParametersSectionProps = RSUSectionProps;
export type OpenCDASensingSectionProps = RSUSectionProps;
export type SensingCameraSectionProps = RSUSectionProps;
export type SensingLidarSectionProps = RSUSectionProps;
export type SensingLocalizationSectionProps = RSUSectionProps;
export type SensingPerceptionSectionProps = RSUSectionProps;

export interface OpenCDAColorSectionProps extends RSUSectionProps {
  showColor: boolean;
  setShowColor: BooleanSetter;
}

export interface BehaviorServicesSectionProps extends RSUSectionProps {
  showBehaviorServices: boolean;
  setShowBehaviorServices: BooleanSetter;
}

export interface OpenCDAIdentitySectionProps extends RSUSectionProps {
  showName: boolean;
  setShowName: BooleanSetter;
  showId: boolean;
  setShowId: BooleanSetter;
  setShowBehaviorServices: BooleanSetter;
}

export interface AIMServerEditorProps {
  service: Extract<RsuBehaviorService, { type: 'aim_server' }>;
  onChange: (
    patch: Partial<Extract<RsuBehaviorService, { type: 'aim_server' }>>
  ) => void;
}
