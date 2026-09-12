import { Divider, Menu, MenuItem } from '@mui/material';
import { Folder as FolderIcon } from '@mui/icons-material';
import { Save as SaveIcon } from '@mui/icons-material';
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { FileMenuProps, FolderIconStyles } from '../types/FileMenuTypes';

export default function FileMenu({
  anchorEl,
  onClose,
  onUpload,
  readOnly,
  onSave,
  onWorkspaceChange,
}: FileMenuProps) {
  const onOpenFile = () => {
    window.editorModals?.openMapPicker();
  };

  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <MenuItem
        disabled={readOnly}
        onClick={() => {
          onOpenFile();
          onClose();
        }}
      >
        <FolderIcon fontSize="small" style={FolderIconStyles} /> Open...
      </MenuItem>
      <MenuItem
        disabled={readOnly}
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
          onWorkspaceChange('simulation');
          onClose();
        }}
      >
        <PlayArrowIcon fontSize="small" style={FolderIconStyles} /> Run
        simulation
      </MenuItem>
      <MenuItem
        onClick={() => {
          onWorkspaceChange('results');
          onClose();
        }}
      >
        <AssessmentIcon fontSize="small" style={FolderIconStyles} /> Results
      </MenuItem>
      <Divider />
      <MenuItem
        disabled={readOnly}
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
