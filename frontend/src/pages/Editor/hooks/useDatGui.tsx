import { useEffect, useRef } from 'react';
import * as dat from 'dat.gui';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HexColorPicker } from 'react-colorful';
import { WEATHER_OPTIONS } from './types/useDatGuiTypes';
import type { UseDatGuiOptions,  DatGuiParams, DatGUIFolder} from './types/useDatGuiTypes';




export function useDatGui(options: UseDatGuiOptions) {
  const paramsRef = useRef<DatGuiParams>({
    resolution:     0.3,
    ref_line:       true,
    roadmarks:      true,
    wireframe:      false,
    spotlight:      true,
    lateralProfile: true,
    laneHeight:     true,
    view_mode:      'Default',
  });

  useEffect(() => {
    const {
      onLoadFile, onReloadMap, onFitView,
      onAddCube, onAddRSU, onAddPoints, onDeleteCube, onSave,
      onColorChange, onNameChange,
      meshVisRef, scenarioSettingsRef,
    } = options;

    const P = paramsRef.current;

    const ACTIONS = {
      load_file: () => {
        const input = document.createElement('input');
        input.type   = 'file';
        input.accept = '.xodr';
        input.addEventListener('change', (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload  = ev => { if (typeof ev.target?.result === 'string') onLoadFile(ev.target.result); };
          reader.onerror = () => alert('Failed to read file.');
          reader.readAsText(file);
        });
        input.click();
      },
      fitView:      onFitView,
      reload_map:   onReloadMap,
      addCube:      onAddCube,
      addRSU:       onAddRSU,
      addPoints:    onAddPoints,
      deleteCube:   onDeleteCube,
      saveScenario: onSave,
      model:        '',
    };

    const gui = new dat.GUI();
    gui.add(ACTIONS, 'load_file').name('📁 Load .xodr');
    gui.add(P, 'resolution', { Low: 1.0, Medium: 0.3, High: 0.02 }).name('📏 Detail').onChange(() => onReloadMap());
    gui.add(P, 'spotlight').name('🔦 Spotlight');
    gui.add(ACTIONS, 'fitView').name('⟲ Reset Camera');

    const viewF = gui.addFolder('View');
    viewF.add(P, 'view_mode', { Default: 'Default', Outlines: 'Outlines' }).name('View Mode').onChange((val: string) => {
      const m = meshVisRef.current;
      if (m.roadmarks_mesh) m.roadmarks_mesh.visible = (val === 'Default' && P.roadmarks);
    });
    viewF.add(P, 'ref_line').name('Reference Line').onChange((val: boolean) => {
      if (meshVisRef.current.refline_lines) meshVisRef.current.refline_lines.visible = val;
    });
    viewF.add(P, 'roadmarks').name('Roadmarks').onChange((val: boolean) => {
      const m = meshVisRef.current;
      if (m.roadmarks_mesh)         m.roadmarks_mesh.visible         = val && P.view_mode !== 'Outlines';
      if (m.roadmark_outline_lines) m.roadmark_outline_lines.visible = val && P.view_mode !== 'Outlines';
    });
    viewF.add(P, 'wireframe').name('Wireframe').onChange((val: boolean) => {
      if (meshVisRef.current.road_network_material) meshVisRef.current.road_network_material.wireframe = val;
    });

    const attrF = gui.addFolder('Load Attributes');
    attrF.add(P, 'lateralProfile').name('Lateral Profile');
    attrF.add(P, 'laneHeight').name('Lane Height');
    attrF.add(ACTIONS, 'reload_map').name('Reload Map');

    const ctrlF = gui.addFolder('Controls');
    ctrlF.add(ACTIONS, 'addCube').name('Add car');
    ctrlF.add(ACTIONS, 'model').name('Car name').onChange((val: string) => onNameChange(val));

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin:8px 10px;display:flex;align-items:center;justify-content:space-between;';

    const lbl = document.createElement('div');
    lbl.textContent  = 'Car color';
    lbl.style.cssText = 'font-size:11px;color:#eee;';
    wrapper.appendChild(lbl);

    const pickerWrap = document.createElement('div');
    pickerWrap.style.cssText = 'position:relative;';

    const colorBox = document.createElement('div');
    colorBox.style.cssText = 'width:28px;height:18px;background:#00ff00;cursor:pointer;border:1px solid #555;border-radius:2px;';

    const pickerContainer = document.createElement('div');
    pickerContainer.style.cssText = 'position:absolute;right:0;top:22px;z-index:9999;display:none;';

    const pickerEl = document.createElement('div');
    pickerContainer.appendChild(pickerEl);

    pickerWrap.append(colorBox, pickerContainer);
    wrapper.appendChild(pickerWrap);
    (ctrlF as unknown as DatGUIFolder).__ul.appendChild(wrapper);

    const root = createRoot(pickerEl);
    root.render(React.createElement(HexColorPicker, {
      color: '#00ff00',
      onChange: (c: string) => {
        onColorChange(c.replace('#', ''));
        colorBox.style.background = c;
      },
    }));

    const togglePicker = (e: Event) => {
      e.stopPropagation();
      pickerContainer.style.display = pickerContainer.style.display === 'none' ? 'block' : 'none';
    };
    const closePicker = (e: Event) => {
      if (e.target !== colorBox && !pickerContainer.contains(e.target as Node)) {
        pickerContainer.style.display = 'none';
      }
    };
    colorBox.addEventListener('click', togglePicker);
    document.addEventListener('click', closePicker);
    pickerContainer.addEventListener('click', e => e.stopPropagation());

    const saveF = gui.addFolder('Save scenario');
    saveF.add(scenarioSettingsRef.current, 'scenario_id').name('ID scenario');
    saveF.add(scenarioSettingsRef.current, 'scenario_name').name('name scanario');
  
    saveF.add(scenarioSettingsRef.current, 'weather', WEATHER_OPTIONS).name('Weather');
    saveF.add(ACTIONS, 'saveScenario').name('Save scenario');

    window.PARAMS = { ...P, ...ACTIONS };

    return () => {
      colorBox.removeEventListener('click', togglePicker);
      document.removeEventListener('click', closePicker);
      setTimeout(() => root.unmount(), 0);
      gui.destroy();
    };
  }, []); 

  return paramsRef;
}