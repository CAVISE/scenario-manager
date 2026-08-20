import { FormControlLabel, Stack, Switch } from '@mui/material';
import { useEditorStore } from '@/store';
import type { Car } from '@/store/types/useEditorStoreTypes';

interface CarLocalPlannerDebugSectionProps {
  car: Car;
  showLocalPlanner: boolean;
  setShowLocalPlanner: (value: boolean) => void;
}

export function CarLocalPlannerDebugSection({
  car,
  showLocalPlanner,
  setShowLocalPlanner,
}: CarLocalPlannerDebugSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showLocalPlanner}
            onChange={(e) => {
              setShowLocalPlanner(e.target.checked);
              updateCar(car.id, {
                opencda_local_planner_debug: e.target.checked
                  ? true
                  : undefined,
                opencda_local_planner_debug_trajectory: e.target.checked
                  ? true
                  : undefined,
              });
            }}
          />
        }
        label="local_planner debug overrides"
      />
      {showLocalPlanner && (
        <Stack spacing={0.5} sx={{ pl: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={car.opencda_local_planner_debug ?? false}
                onChange={(e) =>
                  updateCar(car.id, {
                    opencda_local_planner_debug: e.target.checked,
                  })
                }
              />
            }
            label="debug"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={car.opencda_local_planner_debug_trajectory ?? false}
                onChange={(e) =>
                  updateCar(car.id, {
                    opencda_local_planner_debug_trajectory: e.target.checked,
                  })
                }
              />
            }
            label="debug_trajectory"
          />
        </Stack>
      )}
    </>
  );
}
