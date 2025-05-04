import * as React from 'react';
import Box from '@mui/material/Box';
import Backdrop from '@mui/material/Backdrop';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import CarIcon from '@mui/icons-material/DirectionsCar';
import AddLocationIcon from '@mui/icons-material/AddLocation';

// @ts-ignore
export default function SpeedDialTooltipOpen({ onAddCar, onAddPoint }) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const actions = [
    { icon: <CarIcon />, name: 'Добавить машину', action: onAddCar },
    { icon: <AddLocationIcon />, name: 'Добавить точку', action: onAddPoint },
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
