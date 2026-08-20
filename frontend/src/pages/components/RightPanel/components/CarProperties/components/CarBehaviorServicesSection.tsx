import { FormControlLabel, Stack, Switch } from '@mui/material';
import { useEditorStore } from '@/store';
import type {
  Car,
  CavBehaviorService,
} from '@/store/types/useEditorStoreTypes';

interface CarBehaviorServicesSectionProps {
  car: Car;
  showBehaviorServices: boolean;
  setShowBehaviorServices: (value: boolean) => void;
}

export function CarBehaviorServicesSection({
  car,
  showBehaviorServices,
  setShowBehaviorServices,
}: CarBehaviorServicesSectionProps) {
  const updateCar = useEditorStore((s) => s.updateCar);

  const services = car.opencda_behavior_services ?? [];
  const hasService = (type: CavBehaviorService['type']) =>
    services.some((s) => s.type === type);
  const aimClient = services.find(
    (s): s is Extract<CavBehaviorService, { type: 'aim_client' }> =>
      s.type === 'aim_client'
  );

  const setServices = (next: CavBehaviorService[]) => {
    updateCar(car.id, {
      opencda_behavior_services: next.length > 0 ? next : undefined,
    });
  };

  const toggleService = (type: CavBehaviorService['type'], on: boolean) => {
    const without = services.filter((s) => s.type !== type);
    if (!on) {
      setServices(without);
      return;
    }
    if (type === 'self_informer') {
      setServices([...without, { type: 'self_informer' }]);
    } else if (type === 'aim_client') {
      setServices([...without, { type: 'aim_client', debug: false }]);
    } else {
      setServices([...without, { type: 'movement_controller' }]);
    }
  };

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={showBehaviorServices}
            onChange={(e) => {
              setShowBehaviorServices(e.target.checked);
              if (e.target.checked) {
                setServices([
                  { type: 'self_informer' },
                  { type: 'aim_client', debug: false },
                  { type: 'movement_controller' },
                ]);
              } else {
                setServices([]);
              }
            }}
          />
        }
        label="behavior_services (AIM stack)"
      />
      {showBehaviorServices && (
        <Stack spacing={0.5} sx={{ pl: 1 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasService('self_informer')}
                onChange={(e) =>
                  toggleService('self_informer', e.target.checked)
                }
              />
            }
            label="self_informer"
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasService('aim_client')}
                onChange={(e) => toggleService('aim_client', e.target.checked)}
              />
            }
            label="aim_client"
          />
          {hasService('aim_client') && (
            <FormControlLabel
              sx={{ pl: 2 }}
              control={
                <Switch
                  size="small"
                  checked={aimClient?.debug ?? false}
                  onChange={(e) =>
                    setServices(
                      services.map((s) =>
                        s.type === 'aim_client'
                          ? { ...s, debug: e.target.checked }
                          : s
                      )
                    )
                  }
                />
              }
              label="aim_client.debug"
            />
          )}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={hasService('movement_controller')}
                onChange={(e) =>
                  toggleService('movement_controller', e.target.checked)
                }
              />
            }
            label="movement_controller"
          />
        </Stack>
      )}
    </>
  );
}
