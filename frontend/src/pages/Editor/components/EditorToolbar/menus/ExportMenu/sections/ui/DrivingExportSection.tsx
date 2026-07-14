import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
import { useEditorStore } from '../../../../../../../../store';
import { buildOpenCDAArtifact } from '../../../../../../Generators/configGenerators';
import { generateCarlaYaml } from '../../../../../../Generators/exporters';
import { mergeSimConfigWithDefaults } from '../../../../../../Generators/types/configGeneratorsTypes';

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
