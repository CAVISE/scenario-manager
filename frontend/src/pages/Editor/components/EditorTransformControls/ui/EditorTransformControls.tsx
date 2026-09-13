import { useState } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  OpenWith as OpenWithIcon,
  RotateRight as RotateRightIcon,
  ZoomOutMap as ZoomOutMapIcon,
  DirectionsCar as CarIcon,
  AddLocation as RsuIcon,
  Apartment as BuildingIcon,
  AccessibilityNew as PedestrianIcon,
  Timeline as WaypointIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTransformMode } from '@editor/hooks/useEditorEngine/useTransformMode';
import { useEditorRefs, useHooks } from '@editor/context';
import { useEditorStore } from '@/store';

export const EditorTransformControls = ({
  readOnly = false,
}: {
  readOnly?: boolean;
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const { transformControlsRef } = useEditorRefs();
  const {
    handleAddCube,
    handleAddRSU,
    handleAddPedestrian,
    handleAddPoints,
    handleSetBuildingMode,
  } = useHooks();
  const { transformMode, handleSetMode } =
    useTransformMode(transformControlsRef);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedCar = useEditorStore(
    (s) =>
      s.selectedIds.length === 1 &&
      s.cars.some((car) => car.id === s.selectedIds[0])
  );
  const canTransform = !readOnly && selectedIds.length === 1;
  const addActions = [
    {
      label: 'Vehicle',
      icon: <CarIcon fontSize="small" />,
      action: handleAddCube,
    },
    { label: 'RSU', icon: <RsuIcon fontSize="small" />, action: handleAddRSU },
    {
      label: 'Building',
      icon: <BuildingIcon fontSize="small" />,
      action: () => handleSetBuildingMode(true),
    },
    {
      label: 'Pedestrian',
      icon: <PedestrianIcon fontSize="small" />,
      action: handleAddPedestrian,
    },
    {
      label: selectedCar ? 'Waypoint' : 'Waypoint — select a vehicle',
      icon: <WaypointIcon fontSize="small" />,
      action: handleAddPoints,
      disabled: !selectedCar,
    },
  ];

  return (
    <div className="editor-transform-tools" data-testid="transform-controls">
      <div className="editor-tool-group" aria-label="Transform selection">
        <span className="editor-tool-group-label">Select</span>
        {(
          [
            {
              mode: 'translate',
              label: 'Move',
              icon: <OpenWithIcon fontSize="small" />,
            },
            {
              mode: 'rotate',
              label: 'Rotate',
              icon: <RotateRightIcon fontSize="small" />,
            },
            {
              mode: 'scale',
              label: 'Scale',
              icon: <ZoomOutMapIcon fontSize="small" />,
            },
          ] as const
        ).map(({ mode, label, icon }) => (
          <Tooltip
            key={mode}
            title={
              selectedIds.length > 1
                ? 'Use common properties to edit the selection'
                : selectedIds.length === 0
                  ? 'Select an object first'
                  : label
            }
          >
            <span>
              <IconButton
                size="small"
                color={transformMode === mode ? 'primary' : 'default'}
                onClick={() => handleSetMode(mode)}
                disabled={!canTransform}
                aria-label={`Transform ${mode}`}
                aria-pressed={transformMode === mode}
                data-testid={`transform-${mode}`}
              >
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </div>
      <span className="editor-tools-divider" />
      <div className="editor-tool-group" aria-label="Add object">
        <span className="editor-tool-group-label">Add</span>
        <Button
          size="small"
          startIcon={<AddIcon />}
          disabled={readOnly}
          aria-haspopup="menu"
          aria-expanded={Boolean(anchor)}
          onClick={(event) => setAnchor(event.currentTarget)}
        >
          Add object
        </Button>
      </div>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor) && !readOnly}
        onClose={() => setAnchor(null)}
      >
        {addActions.map(({ label, icon, action, disabled }) => (
          <MenuItem
            key={label}
            disabled={disabled || readOnly}
            onClick={() => {
              setAnchor(null);
              action();
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};
