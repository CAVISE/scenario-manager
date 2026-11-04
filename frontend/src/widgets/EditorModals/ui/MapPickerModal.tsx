import {
  Alert,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Typography,
} from '@mui/material';
import { MapOutlined as MapOutlinedIcon } from '@mui/icons-material';
import { CARLA_MAPS } from '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository';

interface MapPickerModalProps {
  open: boolean;
  error: string | null;
  loadingMap: string | null;
  onClose: () => void;
  onSelectMap: (mapName: string) => void;
}

export function MapPickerModal({
  open,
  error,
  loadingMap,
  onClose,
  onSelectMap,
}: MapPickerModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box className="editor-map-picker-modal">
        <Box className="editor-map-picker-modal__header">
          <MapOutlinedIcon />
          <Typography className="editor-map-picker-modal__title" variant="h6">
            Select map
          </Typography>
        </Box>
        {error ? (
          <Alert className="editor-modal-alert" severity="error">
            {error}
          </Alert>
        ) : null}
        <List className="editor-map-picker-modal__list" dense>
          {CARLA_MAPS.map((mapName) => (
            <ListItemButton
              key={mapName}
              onClick={() => onSelectMap(mapName)}
              disabled={Boolean(loadingMap)}
              className="editor-map-picker-modal__item"
            >
              <ListItemText
                primary={mapName}
                secondary={loadingMap === mapName ? 'Loading…' : undefined}
                slotProps={{
                  primary: {
                    className: 'editor-map-picker-modal__item-primary',
                  },

                  secondary: {
                    className: 'editor-map-picker-modal__item-secondary',
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Modal>
  );
}
