import { ListSubheader, MenuItem } from '@mui/material';
import { useEditorStore } from '@/store';
import { generateSionnaConfig } from '@editor/Generators/exporters';
import { mergeSimConfigWithDefaults } from '@editor/Generators/types/configGeneratorsTypes';
import { Download as DownloadIcon } from '@mui/icons-material';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
export default function RayTracingExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportSionna = () => {
    openExportDialog('sionna_config.json', () => {
      const {
        simConfig: raw,
        RSUs,
        buildings,
        cars,
      } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return JSON.stringify(
        generateSionnaConfig(simConfig, RSUs, buildings, cars),
        null,
        2,
      );
    });
  };
  return (
    <>
      <ListSubheader sx={ListSubheaderStyles}>
        Channel / Ray tracing
      </ListSubheader>
      <MenuItem onClick={handleExportSionna}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Sionna (.json)
      </MenuItem>
    </>
  );
}
