import React, { useState, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import FileMenu from './menus/FileMenu';
import ExportMenu from './menus/ExportMenu/ExportMenu';
import { EditorToolbarDivStyles, EditorToolbarStyles, PendingExport, type EditorToolbarProps } from './types/EditorToolbarTypes';
import { downloadFile } from '../../Generators/exporters';
import UploadScenariosModal from '../UploadScenariosModal/UploadScenariosModal';
import SimConfigModal from '../SimConfigModal/SimConfigModal';
import ExportDialog from './dialogs/ExportDialog';

function sanitizeDownloadFilename(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  return t.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim() || fallback;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  buildingModelRef,
  updateSceneGraph,
}) => {
  const [fileMenuAnchor,   setFileMenuAnchor]   = useState<null | HTMLElement>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [uploadModalOpen,  setUploadModalOpen]  = useState(false);
  const [simConfigOpen,    setSimConfigOpen]    = useState(false);
  const [pendingExport,    setPendingExport]    = useState<PendingExport | null>(null);
  const [exportFilename,   setExportFilename]   = useState('');
 
  
  
  const openExportDialog = useCallback((defaultFilename: string, getContent: () => string) => {
    setExportMenuAnchor(null);
    setExportFilename(defaultFilename);
    setPendingExport({ defaultFilename, getContent });
  }, []);

  const closeExportDialog = () => {
    setPendingExport(null);
    setExportFilename('');
  };

  const confirmExportDownload = () => {
    if (!pendingExport) return;
    const safe = sanitizeDownloadFilename(exportFilename, pendingExport.defaultFilename);
    downloadFile(safe, pendingExport.getContent());
    closeExportDialog();
  };

  return (
    <div style={EditorToolbarStyles}>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Menu">
          <IconButton size="small" onClick={e => setFileMenuAnchor(e.currentTarget)}>
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <FileMenu
          anchorEl={fileMenuAnchor}
          onClose={() => setFileMenuAnchor(null)}
          onUpload={() => setUploadModalOpen(true)}
        />
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Export config">
          <IconButton size="small" onClick={e => setExportMenuAnchor(e.currentTarget)}>
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <ExportMenu
          anchorEl={exportMenuAnchor}
          onClose={() => setExportMenuAnchor(null)}
          openExportDialog={openExportDialog}
        />
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Simulation settings">
          <IconButton size="small" onClick={() => setSimConfigOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <UploadScenariosModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        buildingModelRef={buildingModelRef}
        updateSceneGraph={updateSceneGraph}
      />
      <SimConfigModal open={simConfigOpen} onClose={() => setSimConfigOpen(false)} />
      <ExportDialog
        open={Boolean(pendingExport)}
        filename={exportFilename}
        onFilenameChange={setExportFilename}
        onConfirm={confirmExportDownload}
        onClose={closeExportDialog}
      />

    </div>
  );
};
