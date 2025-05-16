import React, { useState, useMemo } from 'react';
import { 
  Modal, 
  Box, 
  Tabs, 
  Tab, 
  IconButton, 
  Typography,
  Grid
} from '@mui/material';
import { 
  Card,
  AspectRatio
} from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';
import ImageViewerModal from './ImageViewerModal';

interface TelemetryModalProps {
  open: boolean;
  onClose: () => void;
}

// Типы для вкладок и группировки изображений
type TabCategories = 'routes' | 'telemetry' | 'localization' | 'other';
type ImagesByTabType = Record<TabCategories, Array<{ url: string, name: string }>>;

// Стилизованные компоненты
const ModalContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 1200,
  maxHeight: '90vh',
  overflow: 'auto',
  backgroundColor: 'white',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: 24,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column'
});

const ModalHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16
});

const TitleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
});

const ImageCard = styled(Card)({
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)'
  }
});

const TabPanel = styled(Box)({
  padding: 8,
  flex: 1
});

const TelemetryModal: React.FC<TelemetryModalProps> = ({ open, onClose }) => {
  // Состояния компонента
  const [activeTab, setActiveTab] = useState<TabCategories>('routes');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Загрузка изображений с помощью import.meta.glob
  // В реальном приложении здесь используется import.meta.glob
  // Для демо без Vite эмулируем результат этой функции
  const imageModules = useMemo(() => {
    // В продакшн-коде здесь будет: 
    // const modules = import.meta.glob('/public/results/*.png', { eager: true });
    
    // Эмуляция функциональности import.meta.glob для демонстрации
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

  // Группировка изображений по категориям
  const groupImagesByTab = (modules: Record<string, { default: string }>): ImagesByTabType => {
    const result: ImagesByTabType = {
      routes: [],
      telemetry: [],
      localization: [],
      other: []
    };

    Object.entries(modules).forEach(([path, module]) => {
      // Получаем только имя файла без пути
      const fileName = path.split('/').pop() || '';
      const lowerFileName = fileName.toLowerCase();
      const imageUrl = module.default;
      const displayName = fileName.replace('.png', '').replace(/_/g, ' ');
      
      // Распределяем по категориям согласно ТЗ
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

  // Группируем изображения
  const imagesByTab = useMemo(() => 
    groupImagesByTab(imageModules),
  [imageModules]);
  
  // Обработчики событий
  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabCategories) => {
    setActiveTab(newValue);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const tabLabels = {
    routes: `Маршруты (${imagesByTab.routes.length})`,
    telemetry: `Телеметрия (${imagesByTab.telemetry.length})`,
    localization: `Локализация (${imagesByTab.localization.length})`,
    other: `Прочее (${imagesByTab.other.length})`
  };

  // Отрисовка содержимого активной вкладки
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
      {/* Основной модальный компонент */}
      <Modal open={open} onClose={onClose}>
        <ModalContainer>
          {/* Заголовок и кнопка закрытия */}
          <ModalHeader>
            <TitleContainer>
              <Typography variant="h5" component="h2">
                Результаты
              </Typography>
            </TitleContainer>
            <IconButton onClick={onClose} size="small" aria-label="close">
              <CloseIcon />
            </IconButton>
          </ModalHeader>

          {/* Вкладки */}
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

          {/* Контент вкладок */}
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

      {/* Модальное окно для просмотра полноразмерного изображения */}
      <ImageViewerModal 
        open={!!selectedImage} 
        onClose={() => setSelectedImage(null)} 
        imagePath={selectedImage || ''}
        imageAlt="Изображение в полном размере"
      />
    </>
  );
};

export default TelemetryModal; 