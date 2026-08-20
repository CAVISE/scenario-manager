import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '@editor/Generators/types/configGeneratorsTypes';
import { generateMPCConfig } from '@editor/Generators/exporters';
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
      <ListSubheader sx={ListSubheaderStyles}>MPC</ListSubheader>
      <MenuItem onClick={handleExportMPC}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        MPC config (.yaml)
      </MenuItem>
    </>
  );
}
