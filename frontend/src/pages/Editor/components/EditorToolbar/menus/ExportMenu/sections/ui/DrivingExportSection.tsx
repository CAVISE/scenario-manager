import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
import { useEditorStore } from '../../../../../../../../store';
import { mergeSimConfigWithDefaults } from '../../../../../../Generators/types/configGeneratorsTypes';
import {
  generateCarlaYaml,
  generateOpenCDAConfig,
} from '../../../../../../Generators/exporters';

export default function DrivingExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportOpenCDA = () => {
    openExportDialog('opencda_config.yaml', () => {
      const { simConfig: raw, cars, RSUs, points } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateOpenCDAConfig(simConfig, cars, RSUs, points);
    });
  };
  const handleExportCarla = () => {
    openExportDialog('carla_config.yaml', () => {
      const { simConfig: raw, cars, RSUs, points } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateCarlaYaml(simConfig, cars, RSUs, points);
    });
  };
  return (
    <>
      <ListSubheader sx={ListSubheaderStyles}>Driving simulation</ListSubheader>
      <MenuItem onClick={handleExportCarla}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        CARLA (.yaml)
      </MenuItem>
      <MenuItem onClick={handleExportOpenCDA}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        OpenCDA (.yaml)
      </MenuItem>
    </>
  );
}
