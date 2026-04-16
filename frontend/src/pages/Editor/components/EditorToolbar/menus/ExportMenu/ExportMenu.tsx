import { Divider, Menu } from "@mui/material";
import V2XExportSection from "./sections/V2XExportSection";
import RayTracingExportSection from "./sections/RayTracingExportSection";
import DrivingExportSection from "./sections/DrivingExportSection";
import SumoExportSection from "./sections/SumoExportSection";
import CAPIExportSection from "./sections/CAPIExportSection";
import MPCExportSection from "./sections/MPCExportSection";
import { ExportMenuProps } from "./types/ExportMenuTypes";

export default function ExportMenu({ anchorEl, onClose, openExportDialog }: ExportMenuProps) {
  return (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
      <V2XExportSection openExportDialog={openExportDialog} />
      <Divider />
      <RayTracingExportSection openExportDialog={openExportDialog} />
      <Divider />
      <DrivingExportSection openExportDialog={openExportDialog} />
      <Divider />
      <SumoExportSection openExportDialog={openExportDialog} />
      <Divider />
      <CAPIExportSection openExportDialog={openExportDialog} />
      <Divider />
      <MPCExportSection openExportDialog={openExportDialog} />
    </Menu>
  );
}