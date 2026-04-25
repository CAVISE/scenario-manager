import { Divider, Menu, MenuItem } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssessmentIcon from '@mui/icons-material/Assessment';
import UploadIcon from '@mui/icons-material/Upload';
import { FileMenuProps, FolderIconStyles } from '../types/FileMenuTypes';
import { useScenarioSave } from '../../../../hooks/useApiHooks/useScenarioSave';

export default function FileMenu({
  anchorEl,
  onClose,
  onUpload,
}: FileMenuProps) {
  const onOpenFile = () => window.PARAMS?.load_file?.();
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
