import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from './simulation.types';
import { mergeSimConfigWithDefaults } from '../../../../generators/generators.types';
import { generateMPCConfig } from '../../../../generators/exporters';
import { useEditorStore } from '../../../../../../store';

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
