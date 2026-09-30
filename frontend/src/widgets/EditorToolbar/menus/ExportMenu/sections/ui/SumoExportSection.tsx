import '../../../../styles/EditorToolbar.scss';
import { ListSubheader, MenuItem } from '@mui/material';

import { Download as DownloadIcon } from '@mui/icons-material';
import { SimulatorProps } from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import { useEditorStore } from '@/store';
import {
  generatePolyXml,
  generateRouXml,
  generateSumoCfg,
  getSumoNetFilename,
} from '@scenario-export';
import { useAppToast } from '@/shared/ui/AppToast';
import { useEditorRefs } from '@editor/context';
import {
  resolveSumoNetwork,
  buildSumoRoutes,
  getSumoCoordinateOffsets,
} from '@scenario-export';
import {
  resolveXodrTextForSimulation,
  getStoredXodrName,
} from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';

function exportErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function SumoExportSection({
  openExportDialog,
}: SimulatorProps) {
  const { odrMapRef } = useEditorRefs();
  const toast = useAppToast();

  const handleExportSumoCfg = () => {
    const simConfig = mergeSimConfigWithDefaults(
      useEditorStore.getState().simConfig
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
        getSumoNetFilename(simConfig.carla.map)
      );
      const map = odrMapRef.current;
      if (!map) {
        throw new Error(
          'OpenDRIVE map offsets are unavailable; wait for the map to finish loading'
        );
      }
      const routes = buildSumoRoutes(network.content, cars, points, {
        x: map.x_offs,
        y: map.y_offs,
      });
      const content = generateRouXml(simConfig, cars, routes);
      openExportDialog(
        `${simConfig.sumo.scenario_name}.rou.xml`,
        () => content
      );
    } catch (error) {
      toast.error(`Failed to export routes: ${exportErrorMessage(error)}`);
    }
  };

  const handleExportPolyXml = async () => {
    try {
      const { simConfig: raw, buildings } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      const network = await resolveSumoNetwork(
        getSumoNetFilename(simConfig.carla.map)
      );
      const map = odrMapRef.current;
      if (!map) {
        throw new Error(
          'OpenDRIVE map offsets are unavailable; wait for the map to finish loading'
        );
      }
      const offsets = getSumoCoordinateOffsets(network.content, {
        x: map.x_offs,
        y: map.y_offs,
      });
      const content = generatePolyXml(buildings, offsets);
      openExportDialog(
        `${simConfig.sumo.scenario_name}.poly.xml`,
        () => content
      );
    } catch (error) {
      toast.error(`Failed to export polygons: ${exportErrorMessage(error)}`);
    }
  };

  const handleExportNetXml = async () => {
    try {
      const { simConfig: raw } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      const network = await resolveSumoNetwork(
        getSumoNetFilename(simConfig.carla.map)
      );
      openExportDialog(network.filename, () => network.content);
    } catch (error) {
      toast.error(`Failed to export network: ${exportErrorMessage(error)}`);
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
      toast.error(`Failed to export OpenDRIVE: ${exportErrorMessage(error)}`);
    }
  };

  return (
    <>
      <ListSubheader className="editor-toolbar__subheader">SUMO</ListSubheader>
      <MenuItem onClick={handleExportSumoCfg}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        SUMO config (.sumocfg)
      </MenuItem>
      <MenuItem onClick={handleExportRouXml}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Routes (.rou.xml)
      </MenuItem>
      <MenuItem onClick={handleExportPolyXml}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Polygons (.poly.xml)
      </MenuItem>
      <MenuItem onClick={handleExportNetXml}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Network (.net.xml)
      </MenuItem>
      <MenuItem onClick={handleExportXodr}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        OpenDRIVE source (.xodr)
      </MenuItem>
    </>
  );
}
