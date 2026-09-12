import { ListSubheader, MenuItem } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { mergeSimConfigWithDefaults } from '../../../../generators/generators.types';
import {
  generateCAPIServicesXml,
  generateCAPISensorsXml,
  generateCAPIomnetIni,
} from '../../../../generators/exporters';
import { useEditorStore } from '../../../../../../store';
import {
  DownloadIconStyles,
  ListSubheaderStyles,
  SimulatorProps,
} from './simulation.types';
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
