import '../../../../styles/EditorToolbar.scss';
import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { generateOmnetConfig, generateArteryConfig } from '@scenario-export';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import { useEditorStore } from '@/store';
import { SimulatorProps } from '../types/SimulationTypes';

export default function V2XExportSection({ openExportDialog }: SimulatorProps) {
  const handleExportOmnet = () => {
    openExportDialog('omnetpp.ini', () => {
      const {
        simConfig: raw,
        RSUs,
        cars,
        pedestrians,
      } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateOmnetConfig(simConfig, RSUs, cars, pedestrians);
    });
  };
  const handleExportArtery = () => {
    openExportDialog('artery.ini', () => {
      const { simConfig: raw, RSUs, pedestrians } = useEditorStore.getState();
      const simConfig = mergeSimConfigWithDefaults(raw);
      return generateArteryConfig(simConfig, RSUs, pedestrians);
    });
  };
  return (
    <>
      <ListSubheader className="editor-toolbar__subheader">V2X</ListSubheader>
      <MenuItem onClick={handleExportOmnet}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        OMNeT++ (.ini)
      </MenuItem>
      <MenuItem onClick={handleExportArtery}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        Artery (.ini)
      </MenuItem>
    </>
  );
}
