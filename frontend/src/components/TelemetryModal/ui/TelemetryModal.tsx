import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../../api/client';
import { API_URL } from '../../../VARS';
import {
  Modal,
  Box,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Grid,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ImageViewerModal from '../../ImageViewerModal';
import type {
  TelemetryModalProps,
  TabCategories,
  ImagesByTabType,
} from '../types/TelemetryModalTypes';
import {
  ModalContainer,
  ModalHeader,
  TitleContainer,
  DemoChip,
  ImageCard,
  TabPanel,
  telemetryModalImageStyles,
  telemetryModalTypographyStyles,
  telemetryModalBoxStyles,
} from '../types/TelemetryModalTypes';

interface SimStatus {
  run_id: string | null;
  status: string;
}

interface FileEntry {
  filename: string;
  url: string;
}

interface ResultsResponse {
  files: FileEntry[];
  run_id: string;
}

const TelemetryModal: React.FC<TelemetryModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabCategories>('routes');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, { default: string }>>({});
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!open) return;

    api
      .get('api/status')
      .json<SimStatus>()
      .then((status) => {
        if (!status.run_id || status.status !== 'finished') {
          setImages({});
          setIsEmpty(true);
          return;
        }

        return api
          .get(`api/results/${status.run_id}`)
          .json<ResultsResponse>()
          .then((data) => {
            const imgs: Record<string, { default: string }> = {};
            for (const entry of data.files) {
              imgs[entry.filename] = {
                default: `${API_URL}${entry.url}`,
              };
            }
            setImages(imgs);
            setIsEmpty(Object.keys(imgs).length === 0);
          });
      })
      .catch(() => {
        setImages({});
        setIsEmpty(true);
      });
  }, [open]);

  const groupImagesByTab = (
    modules: Record<string, { default: string }>,
  ): ImagesByTabType => {
    const result: ImagesByTabType = {
      routes: [],
      telemetry: [],
      localization: [],
      other: [],
    };

    Object.entries(modules).forEach(([filename, module]) => {
      const imageUrl = module.default;
      const lower = filename.toLowerCase();
      const displayName = filename.replace('.png', '').replace(/_/g, ' ');

      if (/_routes\.png$/i.test(lower)) {
        result.routes.push({ url: imageUrl, name: displayName });
      } else if (
        /_localization_plotting\.png$/i.test(lower) ||
        /_kinematics_plotting\.png$/i.test(lower)
      ) {
        result.localization.push({ url: imageUrl, name: displayName });
      } else if (
        /_velocity\.png$/i.test(lower) ||
        /_imu\.png$/i.test(lower) ||
        /_hazard\.png$/i.test(lower)
      ) {
        result.telemetry.push({ url: imageUrl, name: displayName });
      } else if (/(route|planned|actual|fig\d+)/i.test(lower)) {
        result.routes.push({ url: imageUrl, name: displayName });
      } else if (
        /(event|accelerometer|gyro|collide|offroad|stuck|traffic)/i.test(lower)
      ) {
        result.telemetry.push({ url: imageUrl, name: displayName });
      } else if (/(localization|kinematics)/i.test(lower)) {
        result.localization.push({ url: imageUrl, name: displayName });
      } else {
        result.other.push({ url: imageUrl, name: displayName });
      }
    });

    for (const key of Object.keys(result) as TabCategories[]) {
      result[key].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  };

  const imagesByTab = useMemo(() => groupImagesByTab(images), [images]);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: TabCategories,
  ) => {
    setActiveTab(newValue);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const tabLabels = {
    routes: `Routes (${imagesByTab.routes.length})`,
    telemetry: `Telemetry (${imagesByTab.telemetry.length})`,
    localization: `Localization (${imagesByTab.localization.length})`,
    other: `Others (${imagesByTab.other.length})`,
  };

  const renderTabContent = (tabKey: TabCategories) => {
    const tabImages = imagesByTab[tabKey];

    return (
      <Grid container spacing={2}>
        {tabImages.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${tabKey}-${index}`}>
            <ImageCard onClick={() => handleImageClick(image.url)}>
              <Box sx={{ position: 'relative', paddingTop: '75%' }}>
                <img
                  src={image.url}
                  alt={image.name}
                  loading="lazy"
                  style={telemetryModalImageStyles}
                />
              </Box>
              <Typography sx={telemetryModalTypographyStyles}>
                {image.name}
              </Typography>
            </ImageCard>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalHeader>
            <TitleContainer>
              <Typography variant="h5" component="h2">
                Results
              </Typography>
              {isEmpty && (
                <Tooltip title="No simulation results yet">
                  <DemoChip label="NO DATA" size="small" />
                </Tooltip>
              )}
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          {isEmpty ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No results yet. Run a simulation first.
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={telemetryModalBoxStyles}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  aria-label="telemetry tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label={tabLabels.routes} value="routes" />
                  <Tab label={tabLabels.telemetry} value="telemetry" />
                  <Tab label={tabLabels.localization} value="localization" />
                  <Tab label={tabLabels.other} value="other" />
                </Tabs>
              </Box>

              <TabPanel
                sx={{ display: activeTab === 'routes' ? 'block' : 'none' }}
              >
                {renderTabContent('routes')}
              </TabPanel>
              <TabPanel
                sx={{ display: activeTab === 'telemetry' ? 'block' : 'none' }}
              >
                {renderTabContent('telemetry')}
              </TabPanel>
              <TabPanel
                sx={{
                  display: activeTab === 'localization' ? 'block' : 'none',
                }}
              >
                {renderTabContent('localization')}
              </TabPanel>
              <TabPanel
                sx={{ display: activeTab === 'other' ? 'block' : 'none' }}
              >
                {renderTabContent('other')}
              </TabPanel>
            </>
          )}
        </ModalContainer>
      </Modal>

      <ImageViewerModal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imagePath={selectedImage || ''}
        imageAlt="Full size image"
      />
    </>
  );
};

export default TelemetryModal;
