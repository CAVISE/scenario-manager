import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip, Divider, ListSubheader } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import FolderIcon from '@mui/icons-material/Folder';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AssessmentIcon from '@mui/icons-material/Assessment';
import UploadIcon from '@mui/icons-material/Upload';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import UploadScenariosModal from './UploadScenariosModal';
import SimConfigModal from './SimConfigModal';
import { useEditorStore } from '../../../store/useEditorStore';
import {
  generateOmnetConfig,
  generateArteryConfig,
  generateCarlaYaml,
  generateSionnaConfig,
  generateOpenCDAConfig,
  downloadFile,
} from "../Generators/configGenerators";
import type { EditorToolbarProps } from './types/EditorToolbarTypes';

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onOpenFile,
  onSave,
  onOpenSimulationConfirm,
  onOpenTelemetryModal,
}) => {
  const [fileMenuAnchor,   setFileMenuAnchor]   = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [uploadModalOpen,  setUploadModalOpen]  = useState(false);
  const [simConfigOpen,    setSimConfigOpen]    = useState(false);

  const handleFileMenuOpen    = (e: React.MouseEvent<HTMLElement>) => setFileMenuAnchor(e.currentTarget);
  const handleFileMenuClose   = () => setFileMenuAnchor(null);
  const handleExportMenuOpen  = (e: React.MouseEvent<HTMLElement>) => setExportMenuAnchor(e.currentTarget);
  const handleExportMenuClose = () => setExportMenuAnchor(null);

  const handleExportOmnet = () => {
    const { simConfig, RSUs, cars } = useEditorStore.getState();
    downloadFile('omnetpp.ini', generateOmnetConfig(simConfig, RSUs, cars));
    handleExportMenuClose();
  };

  const handleExportArtery = () => {
    const { simConfig, RSUs } = useEditorStore.getState();
    downloadFile('artery.ini', generateArteryConfig(simConfig, RSUs));
    handleExportMenuClose();
  };

  const handleExportCarla = () => {
    const { simConfig, cars, RSUs, points } = useEditorStore.getState();
    downloadFile('carla_config.yaml', generateCarlaYaml(simConfig, cars, RSUs, points));
    handleExportMenuClose();
  };

  const handleExportSionna = () => {
    const { simConfig, RSUs, buildings, cars } = useEditorStore.getState();
    const json = generateSionnaConfig(simConfig, RSUs, buildings, cars);
    downloadFile('sionna_config.json', JSON.stringify(json, null, 2));
    handleExportMenuClose();
  };

  const handleExportOpenCDA = () => {
    const { simConfig, cars, RSUs, points } = useEditorStore.getState();
    downloadFile('opencda_config.yaml', generateOpenCDAConfig(simConfig, cars, RSUs, points));
    handleExportMenuClose();
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10, left: 10,
      display: 'flex',
      gap: 10,
      alignItems: 'start',
      zIndex: 10,
    }}>
      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 4, padding: 4 }}>
        <Tooltip title="Menu">
          <IconButton size="small" onClick={handleFileMenuOpen}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu anchorEl={fileMenuAnchor} open={Boolean(fileMenuAnchor)} onClose={handleFileMenuClose}>
          <MenuItem onClick={() => { onOpenFile(); handleFileMenuClose(); }}>
            <FolderIcon fontSize="small" style={{ marginRight: 8 }} /> Open...
          </MenuItem>
          <MenuItem onClick={() => { onSave(); handleFileMenuClose(); }}>
            <SaveIcon fontSize="small" style={{ marginRight: 8 }} /> Save
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onOpenSimulationConfirm(); handleFileMenuClose(); }}>
            <PlayArrowIcon fontSize="small" style={{ marginRight: 8 }} /> Run simulation
          </MenuItem>
          <MenuItem onClick={() => { onOpenTelemetryModal(); handleFileMenuClose(); }}>
            <AssessmentIcon fontSize="small" style={{ marginRight: 8 }} /> Results
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setUploadModalOpen(true); handleFileMenuClose(); }}>
            <UploadIcon fontSize="small" style={{ marginRight: 8 }} /> Upload
          </MenuItem>
        </Menu>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 4, padding: 4 }}>
        <Tooltip title="Export config">
          <IconButton size="small" onClick={handleExportMenuOpen}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportMenuClose}
        >
          <ListSubheader sx={{ lineHeight: '28px', fontSize: 11, color: 'text.disabled' }}>
            V2X
          </ListSubheader>
          <MenuItem onClick={handleExportOmnet}>
            <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
            OMNeT++ (.ini)
          </MenuItem>
          <MenuItem onClick={handleExportArtery}>
            <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
            Artery (.ini)
          </MenuItem>

          <Divider />

          <ListSubheader sx={{ lineHeight: '28px', fontSize: 11, color: 'text.disabled' }}>
            Channel / Ray tracing
          </ListSubheader>
          <MenuItem onClick={handleExportSionna}>
            <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
            Sionna (.json)
          </MenuItem>

          <Divider />

          <ListSubheader sx={{ lineHeight: '28px', fontSize: 11, color: 'text.disabled' }}>
            Driving simulation
          </ListSubheader>
          <MenuItem onClick={handleExportCarla}>
            <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
            CARLA (.yaml)
          </MenuItem>
          <MenuItem onClick={handleExportOpenCDA}>
            <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
            OpenCDA (.yaml)
          </MenuItem>
        </Menu>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 4, padding: 4 }}>
        <Tooltip title="Simulation settings">
          <IconButton size="small" onClick={() => setSimConfigOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <UploadScenariosModal open={uploadModalOpen} onClose={() => setUploadModalOpen(false)} />
      <SimConfigModal open={simConfigOpen} onClose={() => setSimConfigOpen(false)} />
    </div>
  );
};