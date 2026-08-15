import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  Switch,
  Typography,
} from '@mui/material';
import { RSU } from '../../../../../../../store/types/useEditorStoreTypes';
import { parseNumberInputChange } from '../../../../../../Editor/components/SimConfigModal/utils/numberInputUtils';
import { AIM_CHECK_RSU_BEHAVIOR_SERVICES } from '../../../../../../Editor/Generators/exporters/aimCheckDefaults';
import { numInputSlot } from '../../../../types/PanelTypes';

interface OpenCDAIdentitySectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
  showName: boolean;
  setShowName: (value: boolean) => void;
  showId: boolean;
  setShowId: (value: boolean) => void;
  setShowBehaviorServices: (value: boolean) => void;
}

export function OpenCDAIdentitySection({
  rsu,
  updateRSU,
  showName,
  setShowName,
  showId,
  setShowId,
  setShowBehaviorServices,
}: OpenCDAIdentitySectionProps) {
  return (
    <>
      <Divider />
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        OpenCDA Parameters
      </Typography>

      <Button
        size="small"
        variant="outlined"
        onClick={() => {
          setShowId(true);
          setShowBehaviorServices(true);
          const base = AIM_CHECK_RSU_BEHAVIOR_SERVICES[0];
          updateRSU(rsu.id, {
            opencda_id: rsu.opencda_id ?? 1,
            opencda_behavior_services: [
              {
                ...base,
                control_center_location: { x: rsu.x, y: rsu.y, z: rsu.z },
              },
            ],
          });
        }}
      >
        Apply AIM RSU preset
      </Button>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showName}
            onChange={(e) => {
              setShowName(e.target.checked);
              updateRSU(rsu.id, {
                opencda_name: e.target.checked ? 'rsu1' : undefined,
              });
            }}
          />
        }
        label="Custom name (rsu_list)"
      />
      {showName && (
        <FormControl>
          <FormLabel>name</FormLabel>
          <Input
            size="small"
            value={rsu.opencda_name ?? ''}
            slotProps={numInputSlot}
            onChange={(e) =>
              updateRSU(rsu.id, { opencda_name: e.target.value })
            }
          />
        </FormControl>
      )}

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showId}
            onChange={(e) => {
              setShowId(e.target.checked);
              updateRSU(rsu.id, {
                opencda_id: e.target.checked ? 1 : undefined,
              });
            }}
          />
        }
        label="Custom RSU id"
      />
      {showId && (
        <FormControl>
          <FormLabel>id (often negative)</FormLabel>
          <Input
            size="small"
            type="number"
            slotProps={numInputSlot}
            value={rsu.opencda_id ?? -1}
            onChange={(e) => {
              const parsed_id = parseNumberInputChange(e.target);
              if (parsed_id === undefined || isNaN(parsed_id)) return;
              updateRSU(rsu.id, { opencda_id: parsed_id });
            }}
          />
        </FormControl>
      )}
    </>
  );
}
