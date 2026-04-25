import { Divider, Menu } from '@mui/material';
import { ExportMenuProps } from '../types/ExportMenuTypes';
import {
  V2XExportSection,
  DrivingExportSection,
  SumoExportSection,
  RayTracingExportSection,
  CAPIExportSection,
  MPCExportSection,
} from '../sections';

export default function ExportMenu({
  anchorEl,
  onClose,
  openExportDialog,
}: ExportMenuProps) {
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
