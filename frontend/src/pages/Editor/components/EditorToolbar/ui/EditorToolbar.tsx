import { useState, useCallback } from 'react';
import { Badge, Button, IconButton, Tooltip } from '@mui/material';
import { SaveOutlined, AccountTreeOutlined } from '@mui/icons-material';
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
  EditorToolbarGroupEndStyles,
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
import type { EditorTab } from '../../EditorNavigation/types/EditorNavigationTypes';

function sanitizeDownloadFilename(name: string, fallback: string): string {
  const t = name.trim() || fallback;
  return (
    t
      .replace(/[/\\?%*:|"<>]/g, '_')
      .replace(/\s+/g, ' ')
      .trim() || fallback
  );
}

export const EditorToolbar = ({
  readOnly = false,
  onWorkspaceChange,
  onSave,
  onToggleScene,
  sceneGraphOpen = false,
  showSceneToggle = false,
  isSaving = false,
}: {
  readOnly?: boolean;
  onWorkspaceChange: (tab: EditorTab) => void;
  onSave: () => Promise<void>;
  onToggleScene?: () => void;
  sceneGraphOpen?: boolean;
  showSceneToggle?: boolean;
  isSaving?: boolean;
}) => {
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
    <div className="editor-toolbar" aria-label="Scenario tools">
      {showSceneToggle && (
        <Tooltip
          title={sceneGraphOpen ? 'Hide scene objects' : 'Show scene objects'}
        >
          <IconButton
            aria-label="Toggle scene objects"
            aria-expanded={sceneGraphOpen}
            aria-controls="editor-scene-objects"
            onClick={onToggleScene}
            color={sceneGraphOpen ? 'primary' : 'default'}
          >
            <AccountTreeOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <div style={EditorToolbarGroupEndStyles}>
        <Tooltip title="Menu">
          <IconButton
            size="small"
            aria-label="File menu"
            onClick={(e) => setFileMenuAnchor(e.currentTarget)}
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <FileMenu
          anchorEl={fileMenuAnchor}
          onClose={() => setFileMenuAnchor(null)}
          onUpload={() => setUploadModalOpen(true)}
          readOnly={readOnly}
          onSave={onSave}
          onWorkspaceChange={onWorkspaceChange}
        />
        <Tooltip title="Export config">
          <IconButton
            size="small"
            aria-label="Export configuration"
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

      <div style={EditorToolbarGroupEndStyles}>
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton
              size="small"
              aria-label="Undo"
              onClick={() => undo()}
              disabled={readOnly || !canUndo}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Shift+Z)">
          <span>
            <IconButton
              size="small"
              aria-label="Redo"
              onClick={() => redo()}
              disabled={readOnly || !canRedo}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      <div style={EditorToolbarDivStyles}>
        <Tooltip title="Error log">
          <IconButton
            aria-label="Error log"
            size="small"
            onClick={() => setErrorLogOpen(true)}
          >
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
        <Tooltip title="Simulation settings">
          <IconButton
            size="small"
            aria-label="Simulation settings"
            disabled={readOnly}
            onClick={() => setSimConfigOpen(true)}
          >
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Attack settings">
          <IconButton
            size="small"
            aria-label="Attack settings"
            disabled={readOnly}
            onClick={() => setAttackConfigOpen(true)}
          >
            <SecurityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      <Button
        className="editor-save-button"
        variant="contained"
        size="small"
        startIcon={<SaveOutlined />}
        disabled={readOnly}
        onClick={onSave}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </Button>

      <UploadScenariosModal
        open={uploadModalOpen && !readOnly}
        onClose={() => setUploadModalOpen(false)}
      />
      <SimConfigModal
        open={simConfigOpen && !readOnly}
        onClose={() => setSimConfigOpen(false)}
      />
      <AttackConfigModal
        open={attackConfigOpen && !readOnly}
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
