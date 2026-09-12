import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { mergeSimConfigWithDefaults } from '../../../../generators/generators.types';
import {
  generateArteryConfig,
  generateOmnetConfig,
} from '../../../../generators/exporters';
import { useEditorStore } from '../../../../../../store';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from './simulation.types';

export default function V2XExportSection({ openExportDialog }: SimulatorProps) {
  const handleExportOmnet = () => {
    openExportDialog('omnetpp.ini', () => {
      const { simConfig: raw, RSUs, cars } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateOmnetConfig(simConfig, RSUs, cars);
    });
  };
  const handleExportArtery = () => {
    openExportDialog('artery.ini', () => {
      const { simConfig: raw, RSUs } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateArteryConfig(simConfig, RSUs);
    });
  };
  return (
    <>
      <ListSubheader sx={ListSubheaderStyles}>V2X</ListSubheader>
      <MenuItem onClick={handleExportOmnet}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        OMNeT++ (.ini)
      </MenuItem>
      <MenuItem onClick={handleExportArtery}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Artery (.ini)
      </MenuItem>
    </>
  );
}
