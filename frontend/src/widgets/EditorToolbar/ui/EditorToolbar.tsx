import '../styles/EditorToolbar.scss';
import { useState, useCallback } from 'react';
import { Badge, IconButton, Tooltip } from '@mui/material';
import { AccountTreeOutlined } from '@mui/icons-material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { BugReport as BugReportIcon } from '@mui/icons-material';
import FileMenu from '../menus';
import ExportMenu from '../menus/ExportMenu';
import type {
  EditorToolbarProps,
  PendingExport,
} from '../types/EditorToolbarTypes';
import { downloadFile } from '@scenario-export';
import { useHistoryActions } from '@editor/hooks/createEvents/useHistoryActions';
import { useEditorStore } from '@/store';
import { EditorToolbarDialogs } from './EditorToolbarDialogs';
import { EditorToolbarHistoryControls } from './EditorToolbarHistoryControls';
import { EditorSaveButton } from './EditorSaveButton';

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
}: EditorToolbarProps) => {
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

      <div className="editor-toolbar__group editor-toolbar__group--separated">
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

      <EditorToolbarHistoryControls
        readOnly={readOnly}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="editor-toolbar__group">
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

      <EditorSaveButton
        readOnly={readOnly}
        isSaving={isSaving}
        onSave={onSave}
      />

      <EditorToolbarDialogs
        readOnly={readOnly}
        uploadModalOpen={uploadModalOpen}
        simConfigOpen={simConfigOpen}
        attackConfigOpen={attackConfigOpen}
        errorLogOpen={errorLogOpen}
        pendingExport={pendingExport}
        exportFilename={exportFilename}
        onCloseUpload={() => setUploadModalOpen(false)}
        onCloseSimConfig={() => setSimConfigOpen(false)}
        onCloseAttackConfig={() => setAttackConfigOpen(false)}
        onCloseErrorLog={() => setErrorLogOpen(false)}
        onFilenameChange={setExportFilename}
        onConfirmExport={confirmExportDownload}
        onCloseExport={closeExportDialog}
      />
    </div>
  );
};
