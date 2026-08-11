import { getSumoNetFilename } from '../../../../generators/exporters';
import type { SimulationConfig } from '../../../../generators/generators.types';

export type SumoConfig = SimulationConfig['sumo'];

export const createDefaultVType = (
  index: number,
): SumoConfig['vtypes'][number] => ({
  id: `vType_${index}`,
  minGap: 2.0,
  tau: 0.4,
  vClass: 'passenger',
  carFollowModel: 'IDMM',
  speedFactor: 'normc(1.00,0.00)',
});

export const getNetFilePath = (map: string): string => {
  return `./${getSumoNetFilename(map)}`;
};
