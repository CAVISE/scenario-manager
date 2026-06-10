import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../../../api/client';
import { API_URL } from '../../../VARS';
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
  TabsBar,
  EmptyStateBox,
  ImagePreviewFrame,
  ImagePreviewImg,
  ImageCaption,
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    setLoading(true);
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
      })
      .finally(() => setLoading(false));
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
      const displayName = filename.replace(/\.png$/i, '').replace(/_/g, ' ');

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

  const tabLabels = {
    routes: `Routes (${imagesByTab.routes.length})`,
    telemetry: `Telemetry (${imagesByTab.telemetry.length})`,
    localization: `Localization (${imagesByTab.localization.length})`,
    other: `Others (${imagesByTab.other.length})`,
  };

  const renderTabContent = (tabKey: TabCategories) => {
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
<<<<<<< Updated upstream
      <Grid container spacing={2}>
=======
      <Grid item container spacing={2}>
>>>>>>> Stashed changes
        {tabImages.map((image) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={`${tabKey}-${image.url}`}
          >
            <ImageCard onClick={() => setSelectedImage(image.url)}>
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
  };

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          <ModalHeader>
            <TitleContainer>
              <Typography variant="h5" component="h2" fontWeight={600}>
                Simulation results
              </Typography>
              {isEmpty && !loading && (
                <Tooltip title="No simulation results yet">
                  <DemoChip label="NO DATA" size="small" />
                </Tooltip>
              )}
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          {loading ? (
            <EmptyStateBox>
              <CircularProgress size={32} sx={{ mb: 2 }} />
              <Typography variant="body2">Loading results…</Typography>
            </EmptyStateBox>
          ) : isEmpty ? (
            <EmptyStateBox>
              <Typography variant="body1" gutterBottom>
                No results yet
              </Typography>
              <Typography variant="body2">
                Run a simulation and wait until it finishes, then open Results
                again.
              </Typography>
            </EmptyStateBox>
          ) : (
            <>
              <TabsBar>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
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
                {activeTab === 'routes' && renderTabContent('routes')}
              </TabPanel>
              <TabPanel hidden={activeTab !== 'telemetry'}>
                {activeTab === 'telemetry' && renderTabContent('telemetry')}
              </TabPanel>
              <TabPanel hidden={activeTab !== 'localization'}>
                {activeTab === 'localization' &&
                  renderTabContent('localization')}
              </TabPanel>
              <TabPanel hidden={activeTab !== 'other'}>
                {activeTab === 'other' && renderTabContent('other')}
              </TabPanel>
            </>
          )}
        </ModalContainer>
      </Modal>

      <ImageViewerModal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imagePath={selectedImage || ''}
        imageAlt="Simulation result plot"
      />
    </>
  );
};

export default TelemetryModal;
