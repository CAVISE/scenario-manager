import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  generateOmnetConfig,
  generateArteryConfig,
} from '@editor/Generators/exporters';
import { mergeSimConfigWithDefaults } from '@editor/Generators/types/configGeneratorsTypes';
import { useEditorStore } from '@/store';
import {
  SimulatorProps,
  ListSubheaderStyles,
  DownloadIconStyles,
} from '../types/SimulationTypes';

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
