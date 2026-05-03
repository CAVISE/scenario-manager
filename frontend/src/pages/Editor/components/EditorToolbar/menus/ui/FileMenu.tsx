import { Divider, Menu, MenuItem } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssessmentIcon from '@mui/icons-material/Assessment';
import UploadIcon from '@mui/icons-material/Upload';
import { FileMenuProps, FolderIconStyles } from '../types/FileMenuTypes';
import { useScenarioSave } from '../../../../hooks/useApiHooks/useScenarioSave';
import { useHooks } from '../../../../context';
import { useEffect } from 'react';

export default function FileMenu({
  anchorEl,
  onClose,
  onUpload,
}: FileMenuProps) {
  const { loadFile } = useHooks();

  const onOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xodr';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => loadFile(reader.result as string, true);
      reader.readAsText(file);
    };
    input.click();
  };
  const onSave = useScenarioSave();
  const onOpenSimulationConfirm = () => window.editorModals?.openSimulation();
  useEffect(() => {}, []);
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
