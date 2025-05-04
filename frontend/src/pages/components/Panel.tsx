import React, { useCallback } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Slider,
  Stack
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem }      from '@mui/x-tree-view/TreeItem';
import { HexColorPicker } from 'react-colorful';
import { useEditorStore } from '../../store/useEditorStore';


type RightPanelProps = {
  sceneGraph: { id: string; name: string; children: any[] } | null;
  onDetach: () => void;
};

export default function RightPanel({ sceneGraph, onDetach }: RightPanelProps) {
  const selectedId = useEditorStore(s => s.selectedId);
  const selectObject = useEditorStore(s => s.selectObject);
  const cars       = useEditorStore(s => s.cars);
  const updateCar  = useEditorStore(s => s.updateCar);

  const car = cars.find(c => c.id === selectedId) || null;
  const currentScale = car?.scale ?? 1;

  const renderTreeItem = useCallback((node: any) => (
    <TreeItem key={node.id} itemId={node.id} label={node.name}>
      {node.children?.map(renderTreeItem)}
    </TreeItem>
  ), []);

  // Если ничего не выбрано — просто показываем пустой drawer
  if (!car) {
    return (
      <Drawer
        variant="permanent"
        anchor="right"
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Настройки</Typography>
          <Typography sx={{ mt: 2 }}>Нет выбранного объекта</Typography>
        </Box>
      </Drawer>
    );
  }

  // Хэлпер для полей x/y/z
  const handleNumField = (axis: 'x' | 'y' | 'z') => (e: React.ChangeEvent<HTMLInputElement>) => {
    onDetach();
    updateCar(car.id, { [axis]: parseFloat(e.target.value) });
  };

  // Цвет picker
  const handleColorChange = (hex: string) => {
    onDetach();
    // react-colorful отдаёт со "#"
    updateCar(car.id, { color: hex.replace('#', '') });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDetach();
    updateCar(car.id, { model: e.target.value });
  };

  return (
    <Drawer
      variant="permanent"
      anchor="right"
      sx={{
        width: 300,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: 300, boxSizing: 'border-box' }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Настройки</Typography>

        {/* Сцена */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Объекты</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {sceneGraph ? (
              <SimpleTreeView
                defaultExpandedItems={[sceneGraph.id]}
                selectedItems={selectedId ? [selectedId] : []}
                onItemClick={(event, itemId) => {
                  selectObject(itemId);
                  onDetach();
                }}
              >
                {renderTreeItem(sceneGraph)}
              </SimpleTreeView>
            ) : (
              <Typography>Сцена пуста или загружается...</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Координаты */}
        <Stack spacing={2}>
          {(['x','y','z'] as const).map(axis => (
            <TextField
              key={axis}
              label={`Позиция ${axis.toUpperCase()}`}
              type="number"
              value={car[axis].toFixed(3)}
              onChange={handleNumField(axis)}
              fullWidth
            />
          ))}

          {/* Color picker */}
          <Box>
            <Typography gutterBottom>Цвет</Typography>
            <HexColorPicker
              color={`#${car.color}`}
              onChange={handleColorChange}
            />
            <Box
              sx={{
                mt: 1,
                width: 36,
                height: 14,
                backgroundColor: `#${car.color}`,
                border: '1px solid #ccc'
              }}
            />
          </Box>
          <TextField
            label="Имя машины"
            type="text"
            value={car.model || ''}
            onChange={handleNameChange}
            fullWidth
            sx={{ mb: 2 }}
          />

            <Typography gutterBottom>Размер</Typography>
            <Slider
              value={currentScale}
              min={0.1}
              max={5}
              step={0.1}
              valueLabelDisplay="auto"
              onChange={(_, newValue) => {
                if (typeof newValue === 'number' && car) {
                  onDetach();
                  updateCar(car.id, { scale: newValue });
                }
              }}
              aria-label="Масштаб машины"
            />


        </Stack>
      </Box>
    </Drawer>
  );
}
