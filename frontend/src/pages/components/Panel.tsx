import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Drawer
} from '@mui/material';
import {
  Typography,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Divider,
  Slider,
  Stack,
  Input,
  FormLabel,
  FormControl,
  Grid,
  FormHelperText
} from '@mui/joy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
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

  const [nameError, setNameError] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  useEffect(() => {
    if (car) {
      setNameValue(car.model || '');
      setNameError(null);
    }
  }, [car]);

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
          <Typography level="h4">Настройки</Typography>
          <Typography level="body-md" sx={{ mt: 2 }}>Нет выбранного объекта</Typography>
        </Box>
      </Drawer>
    );
  }

  // Хэлпер для полей x/y/z
  const handleNumField = (axis: 'x' | 'y' | 'z') => (e: React.ChangeEvent<HTMLInputElement>) => {
    updateCar(car.id, { [axis]: parseFloat(e.target.value) });
  };

  const handleColorChange = (hex: string) => {
    const hexValue = hex.replace('#', '');
    console.log(`Updating car color to: ${hexValue}`);
    updateCar(car.id, { color: hexValue });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNameValue(newName);

    // Проверяем на уникальность
    const isDuplicate = cars.some(c => c.id !== car.id && c.model === newName);

    if (isDuplicate) {
      setNameError('Имя машины должно быть уникальным');
    } else {
      setNameError(null);
      // Обновляем только если имя уникально
      updateCar(car.id, { model: newName });
    }
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
        <Typography level="h4" gutterBottom>Настройки</Typography>

        {/* Сцена */}
        <Accordion>
          <AccordionSummary indicator={<KeyboardArrowDownIcon />}>
            <Typography level="title-md">Объекты</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {sceneGraph ? (
              <SimpleTreeView
                defaultExpandedItems={[sceneGraph.id]}
                // @ts-ignore (SimpleTreeView ожидает string, но нам нужен string[])
                selectedItems={selectedId ? [selectedId] : []}
                onItemClick={(event, itemId) => {
                  selectObject(itemId);
                  onDetach();
                }}
              >
                {renderTreeItem(sceneGraph)}
              </SimpleTreeView>
            ) : (
              <Typography level="body-md">Сцена пуста или загружается...</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        <Accordion defaultExpanded>
          <AccordionSummary indicator={<KeyboardArrowDownIcon />}>
            <Typography level="title-md">Свойства</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* Имя машины - первое поле */}
              <FormControl error={!!nameError}>
                <FormLabel>Имя машины</FormLabel>
                {/* @ts-ignore */}
                <Input
                  color={nameError ? "danger" : "neutral"}
                  slotProps={{
                    input: {
                      value: nameValue,
                      onChange: handleNameChange
                    }
                  }}
                />
                {nameError && (
                  <FormHelperText>
                    <Typography level="body-xs" color="danger">
                      {nameError}
                    </Typography>
                  </FormHelperText>
                )}
              </FormControl>

              {/* Координаты X, Y, Z на одной линии */}
              <FormLabel>Позиция</FormLabel>
              <Grid container spacing={1}>
                {(['x','y','z'] as const).map(axis => (
                  <Grid xs={4} key={axis}>
                    <FormControl>
                      <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
                      {/* @ts-ignore */}
                      <Input
                        size="sm"
                        type="number"
                        slotProps={{
                          input: {
                            value: car[axis].toFixed(3),
                            onChange: handleNumField(axis)
                          }
                        }}
                      />
                    </FormControl>
                  </Grid>
                ))}
              </Grid>

              <FormControl>
                <FormLabel>Размер</FormLabel>
                <Slider
                  value={currentScale}
                  min={0.1}
                  max={5}
                  step={0.1}
                  valueLabelDisplay="auto"
                  onChange={(_, newValue) => {
                    if (typeof newValue === 'number' && car) {
                      updateCar(car.id, { scale: newValue });
                    }
                  }}
                  aria-label="Масштаб машины"
                />
              </FormControl>

              {/* Color picker */}
              <FormControl>
                <FormLabel>Цвет</FormLabel>
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
                <Typography level="body-sm" sx={{ mt: 0.5, color: 'neutral.500' }}>
                  Текущий цвет: #{car.color}
                </Typography>
              </FormControl>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Drawer>
  );
}
