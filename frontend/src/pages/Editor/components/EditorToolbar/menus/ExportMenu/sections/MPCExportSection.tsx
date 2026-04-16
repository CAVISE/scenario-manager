import { ListSubheader, MenuItem } from "@mui/material";
import { useEditorStore } from "../../../../../../../store/useEditorStore";
import { generateMPCConfig } from "../../../../../Generators/exporters";
import DownloadIcon from "@mui/icons-material/Download";
import { mergeSimConfigWithDefaults } from "../../../../../Generators/types/configGeneratorsTypes";
import { DownloadIconStyles, ListSubheaderStyles, SimulatorProps } from "./types/SimulationTypes";
export default function MPCExportSection({openExportDialog}: SimulatorProps) {
  const handleExportMPC = () => {
      openExportDialog('mpc_config.yaml', () => {
        const { simConfig: raw } = useEditorStore.getState();
        return generateMPCConfig(mergeSimConfigWithDefaults(raw));
      });
    };
  return (
    <>
        <ListSubheader sx={ListSubheaderStyles}>
              MPC
            </ListSubheader>
            <MenuItem onClick={handleExportMPC}>
              <DownloadIcon fontSize="small" style={DownloadIconStyles} />
              MPC config (.yaml)
            </MenuItem>
    </>
  )
}
