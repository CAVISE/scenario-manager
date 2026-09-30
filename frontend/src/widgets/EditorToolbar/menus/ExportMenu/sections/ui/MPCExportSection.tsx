import '../../../../styles/EditorToolbar.scss';
import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { SimulatorProps } from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import { generateMPCConfig } from '@scenario-export';
import { useEditorStore } from '@/store';

export default function MPCExportSection({ openExportDialog }: SimulatorProps) {
  const handleExportMPC = () => {
    openExportDialog('mpc_config.yaml', () => {
      const { simConfig: raw } = useEditorStore.getState();
      return generateMPCConfig(mergeSimConfigWithDefaults(raw));
    });
  };
  return (
    <>
      <ListSubheader className="editor-toolbar__subheader">MPC</ListSubheader>
      <MenuItem onClick={handleExportMPC}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        MPC config (.yaml)
      </MenuItem>
    </>
  );
}
