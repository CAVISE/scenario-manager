import * as React from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import CarIcon from '@mui/icons-material/DirectionsCar';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import TimelineIcon from '@mui/icons-material/Timeline';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import { IButtStyles, SpeedDialTooltipOpenProps } from './types/IStatusesTypes';
import { useEditorStore } from '../../../store/useEditorStore';

export default function SpeedDialTooltipOpen({
  onAddCar,
  onAddRSU,
  onAddpoints,
  onAddBuilding,
  onAddPedestrian,
}: SpeedDialTooltipOpenProps) {
  const isOpen = useEditorStore(s => s.isPanelOpen)
  const [open, setOpen] = React.useState(false);
  const dialRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setOpen(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dialRef.current && !dialRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [open]);

  if (!isOpen) return null;

  const actions = [
    { icon: <TimelineIcon />, name: 'Add waypoint', action: onAddpoints },
    { icon: <CarIcon />, name: 'Add car', action: onAddCar },
    { icon: <AddLocationIcon />, name: 'Add RSU', action: onAddRSU },
    { icon: <ApartmentIcon />, name: 'Add building', action: () => onAddBuilding(true) },
    { icon: <AccessibilityNewIcon />, name: 'Add a pedestrian', action: onAddPedestrian },
  ];

  return (
    <div ref={dialRef}>
      <SpeedDial
        ariaLabel="SpeedDial tooltip example"
        sx={IButtStyles}
        icon={<SpeedDialIcon />}
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              setOpen(false);
              action.action();
            }}
          />
        ))}
      </SpeedDial>
    </div>
  );
}