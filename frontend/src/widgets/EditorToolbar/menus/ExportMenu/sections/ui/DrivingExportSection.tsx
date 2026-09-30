import '../../../../styles/EditorToolbar.scss';
import { ListSubheader, MenuItem } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { SimulatorProps } from '../types/SimulationTypes';
import { useEditorStore } from '@/store';
import { buildOpenCDAArtifact } from '@scenario-export';
import { generateCarlaYaml } from '@scenario-export';
import { mergeSimConfigWithDefaults } from '@scenario-export';

export default function DrivingExportSection({
  openExportDialog,
}: SimulatorProps) {
  const handleExportOpenCDA = () => {
    openExportDialog('opencda_config.yaml', () =>
      buildOpenCDAArtifact(useEditorStore.getState())
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
      <ListSubheader className="editor-toolbar__subheader">
        Driving simulation
      </ListSubheader>
      <MenuItem onClick={handleExportCarla}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        CARLA (.yaml)
      </MenuItem>
      <MenuItem onClick={handleExportOpenCDA}>
        <DownloadIcon
          fontSize="small"
          className="editor-toolbar__download-icon"
        />
        OpenCDA (.yaml)
      </MenuItem>
    </>
  );
}
