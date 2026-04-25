import { ListSubheader, MenuItem } from '@mui/material';

import DownloadIcon from '@mui/icons-material/Download';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '../../../../../../Generators/types/configGeneratorsTypes';
import { useEditorStore } from '../../../../../../../../store';
import {
  generatePolyXml,
  generateRouXml,
  generateSumoCfg,
} from '../../../../../../Generators/exporters';
export default function SumoExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportSumoCfg = () => {
    const simConfig = mergeSimConfigWithDefaults(
      useEditorStore.getState().simConfig,
    );
    openExportDialog(`${simConfig.sumo.scenario_name}.sumocfg`, () => {
      const { simConfig: raw } = useEditorStore.getState();
      return generateSumoCfg(mergeSimConfigWithDefaults(raw));
    });
  };

  const handleExportRouXml = () => {
    const simConfig = mergeSimConfigWithDefaults(
      useEditorStore.getState().simConfig,
    );
    openExportDialog(`${simConfig.sumo.scenario_name}.rou.xml`, () => {
      const { simConfig: raw, cars } = useEditorStore.getState();
      return generateRouXml(mergeSimConfigWithDefaults(raw), cars);
    });
  };

  const handleExportPolyXml = () => {
    const simConfig = mergeSimConfigWithDefaults(
      useEditorStore.getState().simConfig,
    );
    openExportDialog(`${simConfig.sumo.scenario_name}.poly.xml`, () => {
      const { buildings } = useEditorStore.getState();
      return generatePolyXml(buildings);
    });
  };
  return (
    <>
      <ListSubheader sx={ListSubheaderStyles}>SUMO</ListSubheader>
      <MenuItem onClick={handleExportSumoCfg}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        SUMO config (.sumocfg)
      </MenuItem>
      <MenuItem onClick={handleExportRouXml}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Routes (.rou.xml)
      </MenuItem>
      <MenuItem onClick={handleExportPolyXml}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Polygons (.poly.xml)
      </MenuItem>
    </>
  );
}
