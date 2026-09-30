import '../../../../styles/EditorToolbar.scss';
import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

import { useEditorStore } from '@/store';
import { SimulatorProps } from '../types/SimulationTypes';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import {
  generateCAPIomnetIni,
  generateCAPISensorsXml,
  generateCAPIServicesXml,
} from '@scenario-export';
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
      <ListSubheader className="editor-toolbar__subheader">CAPI</ListSubheader>
      <MenuItem onClick={handleExportCAPIomnet}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        OMNeT++ CAPI (.ini)
      </MenuItem>
      <MenuItem onClick={handleExportCAPIServices}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Services (.xml)
      </MenuItem>
      <MenuItem onClick={handleExportCAPISensors}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Sensors (.xml)
      </MenuItem>
    </>
  );
}
