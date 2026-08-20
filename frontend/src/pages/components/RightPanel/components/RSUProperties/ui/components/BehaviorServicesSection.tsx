import { Box, FormLabel, Switch } from '@mui/material';
import { AIMServerEditor } from './AIMServerEditor';
import type {
  RSU,
  RsuBehaviorService,
} from '@/store/types/useEditorStoreTypes';

interface BehaviorServicesSectionProps {
  rsu: RSU;
  updateRSU: (id: string, props: Partial<RSU>) => void;
  showBehaviorServices: boolean;
  setShowBehaviorServices: (value: boolean) => void;
}

export function BehaviorServicesSection({
  rsu,
  updateRSU,
  showBehaviorServices,
  setShowBehaviorServices,
}: BehaviorServicesSectionProps) {
  const services = rsu.opencda_behavior_services ?? [];
  const aimSvc = services.find(
    (s): s is Extract<RsuBehaviorService, { type: 'aim_server' }> =>
      s.type === 'aim_server'
  );

  const toggleAimServer = (active: boolean) => {
    if (active) {
      updateRSU(rsu.id, {
        opencda_behavior_services: [
          {
            type: 'aim_server',
            debug: true,
            control_radius: 15,
            control_center_location: { x: rsu.x, y: rsu.y, z: rsu.z },
            model: 'MTP',
            underling_model: 'GNN_mtl_gnn',
            hidden_channels: 128,
            weight: 'model_rot_gnn_mtl_np_sumo_0911_e3_1930.pth',
            priority: 1,
          },
        ],
      });
    } else {
      updateRSU(rsu.id, { opencda_behavior_services: [] });
    }
  };

  const updateAimServer = (
    patch: Partial<Extract<RsuBehaviorService, { type: 'aim_server' }>>
  ) => {
    updateRSU(rsu.id, {
      opencda_behavior_services: services.map((s) =>
        s.type === 'aim_server' ? { ...s, ...patch } : s
      ) as RsuBehaviorService[],
    });
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Switch
          size="small"
          checked={showBehaviorServices}
          onChange={(e) => {
            setShowBehaviorServices(e.target.checked);
            toggleAimServer(e.target.checked);
          }}
        />
        <FormLabel>aim_server behavior service</FormLabel>
      </Box>
      {showBehaviorServices && aimSvc && (
        <AIMServerEditor service={aimSvc} onChange={updateAimServer} />
      )}
    </>
  );
}
