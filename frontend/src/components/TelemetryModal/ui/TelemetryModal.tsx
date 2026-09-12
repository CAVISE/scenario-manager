import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  Tabs,
  Tab,
  IconButton,
  Typography,
  Grid,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import type {
  TelemetryModalProps,
  TabCategories,
} from '../types/TelemetryModalTypes';
import {
  ModalContainer,
  ModalHeader,
  TitleContainer,
  DemoChip,
  ImageCard,
  TabPanel,
  TabsBar,
  EmptyStateBox,
  ImagePreviewFrame,
  ImagePreviewImg,
  ImageCaption,
} from '../types/TelemetryModalTypes';
import ImageViewerModal from '@/components/ImageViewerModal';

import { DEFAULT_TAB } from '../constants/TelemetryModal.constants';
import {
  useSimulationResults,
  useGroupedImages,
} from '../hooks/TelemetryModal.hooks';

const TelemetryModal: React.FC<TelemetryModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabCategories>(DEFAULT_TAB);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { images, loading, isEmpty, error } = useSimulationResults(open);
  const imagesByTab = useGroupedImages(images);

  const tabLabels = useMemo(
    () => ({
      routes: `Routes (${imagesByTab.routes.length})`,
      telemetry: `Telemetry (${imagesByTab.telemetry.length})`,
      localization: `Localization (${imagesByTab.localization.length})`,
      other: `Others (${imagesByTab.other.length})`,
    }),
    [imagesByTab]
  );

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: TabCategories) => {
      setActiveTab(value);
    },
    []
  );

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  const handleImageViewerClose = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const renderTabContent = useCallback(
    (tabKey: TabCategories) => {
      const tabImages = imagesByTab[tabKey];

      if (tabImages.length === 0) {
        return (
          <EmptyStateBox>
            <Typography variant="body2" color="text.secondary">
              No images in this category.
            </Typography>
          </EmptyStateBox>
        );
      }

      return (
        <Grid container spacing={2}>
          {tabImages.map((image) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={`${tabKey}-${image.url}`}
            >
              <ImageCard onClick={() => handleImageClick(image.url)}>
                <ImagePreviewFrame>
                  <ImagePreviewImg
                    src={image.url}
                    alt={image.name}
                    loading="lazy"
                    decoding="async"
                  />
                </ImagePreviewFrame>
                <ImageCaption title={image.name}>{image.name}</ImageCaption>
              </ImageCard>
            </Grid>
          ))}
        </Grid>
      );
    },
    [imagesByTab, handleImageClick]
  );

  if (loading) {
    return (
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <EmptyStateBox>
            <CircularProgress size={32} sx={{ mb: 2 }} />
            <Typography variant="body2">Loading results…</Typography>
          </EmptyStateBox>
        </ModalContainer>
      </Modal>
    );
  }

  if (isEmpty) {
    return (
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalHeader>
            <TitleContainer>
              <Typography variant="h5" component="h2" fontWeight={600}>
                Simulation results
              </Typography>
              <Tooltip
                title={
                  error
                    ? 'Results could not be loaded'
                    : 'No simulation results yet'
                }
              >
                <DemoChip label={error ? 'ERROR' : 'NO DATA'} size="small" />
              </Tooltip>
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>
          <EmptyStateBox>
            <Typography variant="body1" gutterBottom>
              {error ? 'Unable to load results' : 'No results yet'}
            </Typography>
            <Typography variant="body2" role={error ? 'alert' : undefined}>
              {error ??
                'Run a simulation and wait until it finishes, then open Results again.'}
            </Typography>
          </EmptyStateBox>
        </ModalContainer>
      </Modal>
    );
  }

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalHeader>
            <TitleContainer>
              <Typography variant="h5" component="h2" fontWeight={600}>
                Simulation results
              </Typography>
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          <TabsBar>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label={tabLabels.routes} value="routes" />
              <Tab label={tabLabels.telemetry} value="telemetry" />
              <Tab label={tabLabels.localization} value="localization" />
              <Tab label={tabLabels.other} value="other" />
            </Tabs>
          </TabsBar>

          <TabPanel hidden={activeTab !== 'routes'}>
            {renderTabContent('routes')}
          </TabPanel>
          <TabPanel hidden={activeTab !== 'telemetry'}>
            {renderTabContent('telemetry')}
          </TabPanel>
          <TabPanel hidden={activeTab !== 'localization'}>
            {renderTabContent('localization')}
          </TabPanel>
          <TabPanel hidden={activeTab !== 'other'}>
            {renderTabContent('other')}
          </TabPanel>
        </ModalContainer>
      </Modal>

      <ImageViewerModal
        open={open && !!selectedImage}
        onClose={handleImageViewerClose}
        imagePath={selectedImage || ''}
        imageAlt="Simulation result plot"
      />
    </>
  );
};

export default TelemetryModal;
