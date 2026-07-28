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
import {
  getStoredXodrName,
  resolveXodrTextForSimulation,
} from '../../../../../../hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';
import {
  buildSumoRoutes,
  resolveSumoNetwork,
} from '../../../../../../Generators/exporters/ui/sumoNetwork';
import { getSumoNetFilename } from '../../../../../../Generators/exporters';

function reportExportError(error: unknown) {
  useEditorStore
    .getState()
    .setError(error instanceof Error ? error : new Error(String(error)));
}

export default function SumoExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportSumoCfg = () => {
    const simConfig = mergeSimConfigWithDefaults(
      useEditorStore.getState().simConfig,
    );
    openExportDialog(`${simConfig.sumo.scenario_name}.sumocfg`, (filename) => {
      const { simConfig: raw } = useEditorStore.getState();
      return generateSumoCfg(mergeSimConfigWithDefaults(raw), filename);
    });
  };

  const handleExportRouXml = async () => {
    try {
      const { simConfig: raw, cars, points } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      const network = await resolveSumoNetwork(
        getSumoNetFilename(simConfig.carla.map),
      );
      const routes = buildSumoRoutes(network.content, cars, points);
      openExportDialog(`${simConfig.sumo.scenario_name}.rou.xml`, () =>
        generateRouXml(simConfig, cars, routes),
      );
    } catch (error) {
      reportExportError(error);
    }
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

  const handleExportNetXml = async () => {
    try {
      const { simConfig: raw } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      const network = await resolveSumoNetwork(
        getSumoNetFilename(simConfig.carla.map),
      );
      openExportDialog(network.filename, () => network.content);
    } catch (error) {
      reportExportError(error);
    }
  };

  const handleExportXodr = async () => {
    try {
      const { simConfig: raw } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      const xodr = await resolveXodrTextForSimulation(simConfig.carla.map);
      if (!xodr) throw new Error('OpenDRIVE map is unavailable');
      openExportDialog(getStoredXodrName(simConfig.carla.map), () => xodr);
    } catch (error) {
      reportExportError(error);
    }
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
      <MenuItem onClick={handleExportNetXml}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Network (.net.xml)
      </MenuItem>
      <MenuItem onClick={handleExportXodr}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        OpenDRIVE source (.xodr)
      </MenuItem>
    </>
  );
}
