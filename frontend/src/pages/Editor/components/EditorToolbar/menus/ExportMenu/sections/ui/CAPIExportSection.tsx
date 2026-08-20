import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

import { useEditorStore } from '@/store';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '@editor/Generators/types/configGeneratorsTypes';
import {
  generateCAPIomnetIni,
  generateCAPISensorsXml,
  generateCAPIServicesXml,
} from '@editor/Generators/exporters';
export default function CAPIExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportCAPISensors = () => {
    openExportDialog('sensors.xml', () => generateCAPISensorsXml());
  };
  const handleExportCAPIomnet = () => {
    openExportDialog('omnet.ini', () => {
      const { simConfig: raw } = useEditorStore.getState();
      return generateCAPIomnetIni(mergeSimConfigWithDefaults(raw));
    });
  };
  const handleExportCAPIServices = () => {
    openExportDialog('services.xml', () => {
      const { simConfig: raw } = useEditorStore.getState();
      return generateCAPIServicesXml(mergeSimConfigWithDefaults(raw));
    });
  };
  return (
    <>
      <ListSubheader sx={ListSubheaderStyles}>CAPI</ListSubheader>
      <MenuItem onClick={handleExportCAPIomnet}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        OMNeT++ CAPI (.ini)
      </MenuItem>
      <MenuItem onClick={handleExportCAPIServices}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Services (.xml)
      </MenuItem>
      <MenuItem onClick={handleExportCAPISensors}>
        <DownloadIcon fontSize="small" style={DownloadIconStyles} />
        Sensors (.xml)
      </MenuItem>
    </>
  );
}
