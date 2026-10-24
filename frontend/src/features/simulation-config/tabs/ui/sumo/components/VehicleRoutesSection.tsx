import { Divider, Typography } from '@mui/material';
import type { VehicleRoutesSectionProps } from '../types/sumoTypes';
import { VehicleRouteCard } from './VehicleRouteCard';

export const VehicleRoutesSection = ({
  cars,
  vtypes,
  onUpdateCar,
}: VehicleRoutesSectionProps) => {
  if (cars.length === 0) {
    return (
      <>
        <Divider />
        <Typography variant="subtitle2" color="text.secondary">
          Vehicle routes
        </Typography>
        <Typography variant="caption" color="text.secondary">
          No vehicles on scene
        </Typography>
      </>
    );
  }

  return (
    <>
      <Divider />
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle routes
      </Typography>
      {cars.map((car, index) => (
        <VehicleRouteCard
          key={car.id}
          car={car}
          index={index}
          vtypes={vtypes}
          onUpdate={(patch) => onUpdateCar(car.id, patch)}
        />
      ))}
    </>
  );
};
