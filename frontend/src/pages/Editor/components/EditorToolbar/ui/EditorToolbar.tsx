import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { Undo as UndoIcon } from '@mui/icons-material';
import { Redo as RedoIcon } from '@mui/icons-material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import FileMenu from '../menus';
import ExportMenu from '../menus/ExportMenu';
import {
  EditorToolbarDivStyles,
  EditorToolbarStyles,
  PendingExport,
} from '../types/EditorToolbarTypes';
import { downloadFile } from '@editor/Generators/exporters';
import { useHistoryActions } from '@editor/hooks/createEvents/useHistoryActions';
import { useEditorStore } from '@/store';
import AttackConfigModal from '../../AttackConfigModal';
import UploadScenariosModal from '../../UploadScenariosModal';
import ExportDialog from '../dialogs';
import ErrorLogModal from '../../ErrorLogModal';
import SimConfigModal from '../../SimConfigModal';

function sanitizeDownloadFilename(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  return (
    t
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || fallback
  );
}

export const EditorToolbar = () => {
  const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [simConfigOpen, setSimConfigOpen] = useState(false);
  const [attackConfigOpen, setAttackConfigOpen] = useState(false);
  const [errorLogOpen, setErrorLogOpen] = useState(false);
  const [pendingExport, setPendingExport] = useState<PendingExport | null>(
    null
  );
  const [exportFilename, setExportFilename] = useState('');
  const { undo, redo, canUndo, canRedo } = useHistoryActions();
  const errorCount = useEditorStore((s) => s.errorLog.length);

  const openExportDialog = useCallback(
    (defaultFilename: string, getContent: (filename: string) => string) => {
      setExportMenuAnchor(null);
      setExportFilename(defaultFilename);
      setPendingExport({ defaultFilename, getContent });
    },
    []
  );

  const closeExportDialog = () => {
    setPendingExport(null);
    setExportFilename('');
  };

  const confirmExportDownload = () => {
    if (!pendingExport) return;
    const safe = sanitizeDownloadFilename(
      exportFilename,
      pendingExport.defaultFilename
    );
    downloadFile(safe, pendingExport.getContent(safe));
    closeExportDialog();
  };

  return (
    <div style={EditorToolbarStyles}>
      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Discard changes?">
          <IconButton size="small" component={Link} to="/">
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Menu">
          <IconButton
            size="small"
            onClick={(e) => setFileMenuAnchor(e.currentTarget)}
          >
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
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton size="small" onClick={undo} disabled={!canUndo}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Shift+Z)">
          <span>
            <IconButton size="small" onClick={redo} disabled={!canRedo}>
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Error log">
          <IconButton size="small" onClick={() => setErrorLogOpen(true)}>
            <Badge
              badgeContent={errorCount}
              color="error"
              max={99}
              overlap="circular"
            >
              <BugReportIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Export config">
          <IconButton
            size="small"
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
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
      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Attack settings">
          <IconButton size="small" onClick={() => setAttackConfigOpen(true)}>
            <SecurityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <UploadScenariosModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
      />
      <SimConfigModal
        open={simConfigOpen}
        onClose={() => setSimConfigOpen(false)}
      />
      <AttackConfigModal
        open={attackConfigOpen}
        onClose={() => setAttackConfigOpen(false)}
      />
      <ErrorLogModal
        open={errorLogOpen}
        onClose={() => setErrorLogOpen(false)}
      />
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
