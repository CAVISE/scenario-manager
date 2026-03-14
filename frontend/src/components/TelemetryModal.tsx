import React, { useState, useMemo } from 'react';
import { 
  Modal, 
  Box, 
  Tabs, 
  Tab, 
  IconButton, 
  Typography,
  Grid,
  Tooltip
} from '@mui/material';
import { 
  AspectRatio
} from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import ImageViewerModal from './ImageViewerModal';
import type { TelemetryModalProps, TabCategories, ImagesByTabType } from './types/TelemetryModalTypes';
import { ModalContainer, ModalHeader, TitleContainer, DemoChip, ImageCard, TabPanel } from './types/TelemetryModalTypes';


const TelemetryModal: React.FC<TelemetryModalProps> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabCategories>('routes');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const imageModules = useMemo(() => {

    const sampleImages = [
      '44_kinematics_plotting.png',
      '44_localization_plotting.png',
      '50_kinematics_plotting.png',
      '56_kinematics_plotting.png',
      '50_localization_plotting.png',
      '56_localization_plotting.png',
      '20250513_081757_velocity_1.png',
      '20250513_081758_Accelerometer_Magnitude_4.png',
      '20250513_081759_Collide_1.png',
      '20250513_081759_fig1_1.png'
    ];
    
    return sampleImages.reduce((acc, name) => {
      acc[name] = { default: `/results/${name}` };
      return acc;
    }, {} as Record<string, { default: string }>);
  }, []);

  const groupImagesByTab = (modules: Record<string, { default: string }>): ImagesByTabType => {
    const result: ImagesByTabType = {
      routes: [],
      telemetry: [],
      localization: [],
      other: []
    };

    Object.entries(modules).forEach(([path, module]) => {
      const fileName = path.split('/').pop() || '';
      const lowerFileName = fileName.toLowerCase();
      const imageUrl = module.default;
      const displayName = fileName.replace('.png', '').replace(/_/g, ' ');
      
      if (/(route|planned|actual|fig\d+)/i.test(lowerFileName)) {
        result.routes.push({ url: imageUrl, name: displayName });
      } else if (/(event|accelerometer|gyro|velocity|collide|offroad|stuck|traffic)/i.test(lowerFileName)) {
        result.telemetry.push({ url: imageUrl, name: displayName });
      } else if (/(localization|kinematics)/i.test(lowerFileName) || /^\d+_/.test(fileName)) {
        result.localization.push({ url: imageUrl, name: displayName });
      } else {
        result.other.push({ url: imageUrl, name: displayName });
      }
    });

    return result;
  };

  const imagesByTab = useMemo(() => 
    groupImagesByTab(imageModules),
  [imageModules]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabCategories) => {
    setActiveTab(newValue);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const tabLabels = {
    routes: `Routes (${imagesByTab.routes.length})`,
    telemetry: `Telemetry (${imagesByTab.telemetry.length})`,
    localization: `Localization (${imagesByTab.localization.length})`,
    other: `Others (${imagesByTab.other.length})`
  };

  const renderTabContent = (tabKey: TabCategories) => {
    const images = imagesByTab[tabKey];
    
    return (
      <Grid container spacing={2}>
        {images.map((image, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${tabKey}-${index}`}>
            <ImageCard onClick={() => handleImageClick(image.url)}>
              <AspectRatio ratio="4/3" sx={{ minHeight: 200 }}>
                <img 
                  src={image.url}
                  alt={image.name}
                  loading="lazy"
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%'
                  }}
                />
              </AspectRatio>
              <Typography sx={{ p: 1, textAlign: 'center', fontSize: '0.875rem' }}>
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
              <Tooltip title="Showing demo data">
                <DemoChip label="DEMO" size="small" />
              </Tooltip>
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
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

          <TabPanel sx={{ display: activeTab === 'routes' ? 'block' : 'none' }}>
            {renderTabContent('routes')}
          </TabPanel>
          <TabPanel sx={{ display: activeTab === 'telemetry' ? 'block' : 'none' }}>
            {renderTabContent('telemetry')}
          </TabPanel>
          <TabPanel sx={{ display: activeTab === 'localization' ? 'block' : 'none' }}>
            {renderTabContent('localization')}
          </TabPanel>
          <TabPanel sx={{ display: activeTab === 'other' ? 'block' : 'none' }}>
            {renderTabContent('other')}
          </TabPanel>
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