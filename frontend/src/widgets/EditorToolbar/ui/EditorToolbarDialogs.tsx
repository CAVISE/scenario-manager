import AttackConfigModal from '@/features/attack-config';
import ErrorLogModal from '@/features/error-log';
import UploadScenariosModal from '@/features/scenario-upload';
import SimConfigModal from '@/features/simulation-config';
import ExportDialog from '../dialogs';
import type { PendingExport } from '../types/EditorToolbarTypes';

interface EditorToolbarDialogsProps {
  readOnly: boolean;
  uploadModalOpen: boolean;
  simConfigOpen: boolean;
  attackConfigOpen: boolean;
  errorLogOpen: boolean;
  pendingExport: PendingExport | null;
  exportFilename: string;
  onCloseUpload: () => void;
  onCloseSimConfig: () => void;
  onCloseAttackConfig: () => void;
  onCloseErrorLog: () => void;
  onFilenameChange: (filename: string) => void;
  onConfirmExport: () => void;
  onCloseExport: () => void;
}

export function EditorToolbarDialogs({
  readOnly,
  uploadModalOpen,
  simConfigOpen,
  attackConfigOpen,
  errorLogOpen,
  pendingExport,
  exportFilename,
  onCloseUpload,
  onCloseSimConfig,
  onCloseAttackConfig,
  onCloseErrorLog,
  onFilenameChange,
  onConfirmExport,
  onCloseExport,
}: EditorToolbarDialogsProps) {
  return (
    <>
      <UploadScenariosModal
        open={uploadModalOpen && !readOnly}
        onClose={onCloseUpload}
      />
      <SimConfigModal
        open={simConfigOpen && !readOnly}
        onClose={onCloseSimConfig}
      />
      <AttackConfigModal
        open={attackConfigOpen && !readOnly}
        onClose={onCloseAttackConfig}
      />
      <ErrorLogModal open={errorLogOpen} onClose={onCloseErrorLog} />
      <ExportDialog
        open={Boolean(pendingExport)}
        filename={exportFilename}
        onFilenameChange={onFilenameChange}
        onConfirm={onConfirmExport}
        onClose={onCloseExport}
      />
    </>
  );
}
