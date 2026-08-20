import * as React from 'react';
import SpeedDial from '@mui/material/SpeedDial';
import { Timeline as TimelineIcon } from '@mui/icons-material';
import { DirectionsCar as CarIcon } from '@mui/icons-material';
import { AddLocation as AddLocationIcon } from '@mui/icons-material';
import { Apartment as ApartmentIcon } from '@mui/icons-material';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { AccessibilityNew as AccessibilityNewIcon } from '@mui/icons-material';
import { IButtStyles } from '@editor/hooks/useApiHooks/useStatusesQuery/types/IStatusesTypes';
import { useEditorStore } from '@/store';
import { useEffect } from 'react';
import { useHooks } from '@editor/context';

export default function SpeedDialTooltipOpen() {
  const {
    handleAddCube,
    handleAddPoints,
    handleAddRSU,
    handleAddPedestrian,
    handleSetBuildingMode,
  } = useHooks();
  const isOpen = useEditorStore((s) => s.isPanelOpen);
  const [open, setOpen] = React.useState(false);
  const dialRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
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
    { icon: <TimelineIcon />, name: 'Add waypoint', action: handleAddPoints },
    { icon: <CarIcon />, name: 'Add car', action: handleAddCube },
    { icon: <AddLocationIcon />, name: 'Add RSU', action: handleAddRSU },
    {
      icon: <ApartmentIcon />,
      name: 'Add building',
      action: () => handleSetBuildingMode(true),
    },
    {
      icon: <AccessibilityNewIcon />,
      name: 'Add a pedestrian',
      action: handleAddPedestrian,
    },
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
