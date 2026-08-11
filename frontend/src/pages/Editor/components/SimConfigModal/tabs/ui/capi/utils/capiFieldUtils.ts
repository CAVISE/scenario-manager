// utils/capiFieldUtils.ts
import { parseNumberInputChange } from '../../../../utils/numberInputUtils';
import type { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

type CapiConfig = SimulationConfig['capi'];

export const updateNumberField = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  field: keyof CapiConfig,
  updateFn: (patch: Partial<CapiConfig>) => void,
) => {
  updateFn({
    [field]: parseNumberInputChange(e.target),
  } as Partial<CapiConfig>);
};

export const updateStringField = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  field: keyof CapiConfig,
  updateFn: (patch: Partial<CapiConfig>) => void,
) => {
  updateFn({ [field]: e.target.value } as Partial<CapiConfig>);
};

export const updateSwitchField = (
  checked: boolean,
  field: keyof CapiConfig,
  updateFn: (patch: Partial<CapiConfig>) => void,
) => {
  updateFn({ [field]: checked } as Partial<CapiConfig>);
};

export const updateSelectField = <V extends CapiConfig['capi_log_level']>(
  value: V,
  field: keyof CapiConfig,
  updateFn: (patch: Partial<CapiConfig>) => void,
) => {
  updateFn({ [field]: value } as Partial<CapiConfig>);
};
