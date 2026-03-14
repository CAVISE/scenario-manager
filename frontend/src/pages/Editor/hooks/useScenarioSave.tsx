import { useRef } from 'react';
import { useEditorStore } from '../../../store/useEditorStore';
import { PORT } from '../../../VARS';
import type { ScenarioSettings } from '../types/editorTypes';

export function useScenarioSave() {
  const scenarioSettingsRef = useRef<ScenarioSettings>({
    scenario_id: '', scenario_name: 'Default Scenario',
    vehicle: 'car', weather: 'ClearNoon',
    arr_car: [], color_arr: [], scenario: [],
  });

  const handleSaveScenario = async () => {
    const s        = useEditorStore.getState();
    const settings = scenarioSettingsRef.current;
    if (!settings.scenario_id) settings.scenario_id = Date.now().toString();

    const canvas = document.querySelector('#ThreeJS canvas') as HTMLCanvasElement;
    const scenario = {
      scenario_id:   s.Scenario?.id      || null,
      scenario_name: s.Scenario?.name    || null,
      weather:       s.Scenario?.weather || null,
      preview:       canvas?.toDataURL('image/png') ?? null,
      scenario: [
        {
          vehicle: 'car',
          path: s.cars.map(car => ({
            x: car.x, y: car.y, z: car.z,
            model:    car.model,
            color:    Number('0x' + car.color),
            scale:    car.scale,
            rotation: Math.floor((car.rotation ?? 0) * 57.32),
            selected: car.id === s.selectedId,
            speed: car.speed,
            points:   s.points.filter(p => p.carId === car.id).map((p, i) => ({ id: i, x: p.x, y: p.y, z: p.z })),
            lidars:   s.lidars.filter(l => l.carId === car.id).map(l => ({
              x: l.x, y: l.y, z: l.z,
              rotation: l.rotation, range: l.range,
              channels: l.channels, rotation_frequency: l.rotation_frequency,
            })),
          })),
        },
        {
          vehicle: 'RSU',
          path: s.RSUs.map(r => ({
            id: r.id,
            name: r.name,

            x: r.x,
            y: r.y,
            z: r.z,

            tx_power: r.tx_power,
            frequency: r.frequency,
            range: r.range,

            protocol: r.protocol,
            network_protocol: r.network_protocol,

            script: r.script || null,

            antenna_type: r.antenna_type,
            antenna_height: r.antenna_height,
            antenna_gain: r.antenna_gain,
            polarization: r.polarization,

            mimo_rows: r.mimo_rows,
            mimo_columns: r.mimo_columns,
            element_spacing: r.element_spacing,

            azimuth: r.azimuth,
            tilt: r.tilt,

            cam_interval: r.cam_interval
          })),
        },
        {
          vehicle: 'building',
          path: s.buildings.map(b => ({ id: b.id, x: b.x, y: b.y, z: b.z, height: b.height, material: b.material })),
        },
      ],
    };
    console.log(JSON.stringify(scenario, null,2))
    try {
      const res = await fetch(`http://localhost:${PORT}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save scenario.');
    }
  };

  return handleSaveScenario;
}