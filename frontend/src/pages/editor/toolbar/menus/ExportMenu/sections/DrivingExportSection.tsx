import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from './simulation.types';
import { useEditorStore } from '../../../../../../store';
import { buildOpenCDAArtifact } from '../../../../generators/configGenerators';
import { generateCarlaYaml } from '../../../../generators/exporters';
import { mergeSimConfigWithDefaults } from '../../../../generators/generators.types';

export default function DrivingExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportOpenCDA = () => {
    openExportDialog('opencda_config.yaml', () =>
      buildOpenCDAArtifact(useEditorStore.getState()),
    );
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
