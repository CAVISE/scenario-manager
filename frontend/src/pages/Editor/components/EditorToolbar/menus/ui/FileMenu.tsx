import { Divider, Menu, MenuItem } from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';
import { Save as SaveIcon } from '@mui/icons-material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { FileMenuProps, FolderIconStyles } from '../types/FileMenuTypes';
import { useScenarioSave } from '@editor/hooks/useApiHooks/useScenarioSave';

export default function FileMenu({
  anchorEl,
  onClose,
  onUpload,
}: FileMenuProps) {
  const onOpenFile = () => {
    window.editorModals?.openMapPicker();
  };
  const onSave = useScenarioSave();
  const onOpenSimulationConfirm = () => window.editorModals?.openSimulation();
  const onOpenTelemetryModal = () => window.editorModals?.openTelemetry();

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem
        onClick={() => {
          onOpenFile();
          onClose();
        }}
      >
        <FolderIcon fontSize="small" style={FolderIconStyles} /> Open...
      </MenuItem>
      <MenuItem
        onClick={() => {
          onSave();
          onClose();
        }}
      >
        <SaveIcon fontSize="small" style={FolderIconStyles} /> Save
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={() => {
          onOpenSimulationConfirm();
          onClose();
        }}
      >
        <PlayArrowIcon fontSize="small" style={FolderIconStyles} /> Run
        simulation
      </MenuItem>
      <MenuItem
        onClick={() => {
          onOpenTelemetryModal();
          onClose();
        }}
      >
        <AssessmentIcon fontSize="small" style={FolderIconStyles} /> Results
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={() => {
          onUpload();
          onClose();
        }}
      >
        <UploadIcon fontSize="small" style={FolderIconStyles} /> Upload
      </MenuItem>
    </Menu>
  );
}
