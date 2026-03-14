import * as React from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import CarIcon from '@mui/icons-material/DirectionsCar';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import TimelineIcon from '@mui/icons-material/Timeline';
import ApartmentIcon from '@mui/icons-material/Apartment';

// @ts-ignore
export default function SpeedDialTooltipOpen({ onAddCar, onAddRSU, onAddpoints, onDeleteCar, onAddBuilding }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const actions = [
    { icon: <TimelineIcon />, name: 'Добавить точки', action: onAddpoints },
    { icon: <CarIcon />, name: 'Добавить машину', action: onAddCar },
    { icon: <AddLocationIcon />, name: 'Добавить RSU', action: onAddRSU },
    { icon: <ApartmentIcon />, name: 'Добавить здание', action: () => onAddBuilding(true) },

  ];

  return (
    <SpeedDial
      ariaLabel="SpeedDial tooltip example"
      sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
      icon={<SpeedDialIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => {
            handleClose();
            action.action();
          }}
        />
      ))}
    </SpeedDial>
  );
}