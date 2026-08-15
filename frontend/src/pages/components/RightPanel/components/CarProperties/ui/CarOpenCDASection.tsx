import { useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../../../../Editor/components/SimConfigModal/opencdaUiStyles';
import {
  AIM_CHECK_CAV_BEHAVIOR_SERVICES,
  AIM_CHECK_CAV_COLOR,
} from '../../../../../Editor/Generators/exporters/aimCheckDefaults';
import { useEditorStore } from '../../../../../../store';
import type { Car } from '../../../../../../store/types/useEditorStoreTypes';
import { CarBehaviorFlagsSection } from '../components/CarBehaviorFlagsSection';
import { CarBehaviorServicesSection } from '../components/CarBehaviorServicesSection';
import { CarColorSection } from '../components/CarColorSection';
import { CarIdentitySection } from '../components/CarIdentitySection';
import { CarKinematicsSection } from '../components/CarKinematicsSection';
import { CarLocalPlannerDebugSection } from '../components/CarLocalPlannerDebugSection';
import { CarModelSection } from '../components/CarModelSection';
import { CarV2XSection } from '../components/CarV2XSection';

export default function CarOpenCDASection({ car }: { car: Car }) {
  const updateCar = useEditorStore((s) => s.updateCar);

  const [showColor, setShowColor] = useState(car.opencda_color != null);
  const [showMaxSpeed, setShowMaxSpeed] = useState(
    car.opencda_max_speed != null,
  );
  const [showV2x, setShowV2x] = useState(car.opencda_v2x != null);
  const [showId, setShowId] = useState(car.opencda_id != null);
  const [showModel, setShowModel] = useState(
    Boolean(car.opencda_carla_model?.trim()),
  );
  const [showBehaviorFlags, setShowBehaviorFlags] = useState(
    car.opencda_ignore_traffic_light != null ||
      car.opencda_overtake_allowed != null,
  );
  const [showBehaviorServices, setShowBehaviorServices] = useState(
    (car.opencda_behavior_services?.length ?? 0) > 0,
  );
  const [showName, setShowName] = useState(Boolean(car.opencda_name?.trim()));
  const [showCollisionAhead, setShowCollisionAhead] = useState(
    car.opencda_collision_time_ahead != null,
  );
  const [showLocalPlanner, setShowLocalPlanner] = useState(
    car.opencda_local_planner_debug != null ||
      car.opencda_local_planner_debug_trajectory != null,
  );

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Box sx={opencdaPanelPaperSx}>
        <Stack spacing={1.5}>
          <Typography sx={opencdaSectionLabelSx}>OpenCDA (CAV)</Typography>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setShowId(true);
              setShowColor(true);
              setShowBehaviorServices(true);
              updateCar(car.id, {
                opencda_id: car.opencda_id ?? 100,
                opencda_color: AIM_CHECK_CAV_COLOR,
                opencda_behavior_services: [...AIM_CHECK_CAV_BEHAVIOR_SERVICES],
              });
            }}
          >
            Apply AIM CAV preset
          </Button>

          <CarIdentitySection
            car={car}
            showName={showName}
            setShowName={setShowName}
            showId={showId}
            setShowId={setShowId}
          />

          <CarModelSection
            car={car}
            showModel={showModel}
            setShowModel={setShowModel}
          />

          <CarColorSection
            car={car}
            showColor={showColor}
            setShowColor={setShowColor}
          />

          <CarKinematicsSection
            car={car}
            showMaxSpeed={showMaxSpeed}
            setShowMaxSpeed={setShowMaxSpeed}
            showCollisionAhead={showCollisionAhead}
            setShowCollisionAhead={setShowCollisionAhead}
          />

          <CarLocalPlannerDebugSection
            car={car}
            showLocalPlanner={showLocalPlanner}
            setShowLocalPlanner={setShowLocalPlanner}
          />

          <CarBehaviorFlagsSection
            car={car}
            showBehaviorFlags={showBehaviorFlags}
            setShowBehaviorFlags={setShowBehaviorFlags}
          />

          <CarV2XSection car={car} showV2x={showV2x} setShowV2x={setShowV2x} />

          <CarBehaviorServicesSection
            car={car}
            showBehaviorServices={showBehaviorServices}
            setShowBehaviorServices={setShowBehaviorServices}
          />
        </Stack>
      </Box>
    </>
  );
}
