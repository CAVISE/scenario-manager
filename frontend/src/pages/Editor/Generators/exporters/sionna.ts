import type { SimulationConfig } from '../types/configGeneratorsTypes';
import type { Building, Car, RSU } from '../../../../store/types/useEditorStoreTypes';

export function generateSionnaConfig(
  config: SimulationConfig,
  RSUs: RSU[],
  buildings: Building[],
  cars: Car[],
): object {
  return {
    scene: { carrier_frequency: config.sionna.carrier_frequency, synthetic_array: true },
    transmitters: RSUs.map((rsu, i) => ({
      name: rsu.name || `rsu_${i}`,
      position: [+rsu.x.toFixed(2), +rsu.y.toFixed(2), +rsu.z.toFixed(2)],
      frequency: rsu.frequency,
      antenna: {
        type: rsu.antenna_type ?? 'isotropic',
        height: rsu.antenna_height ?? 5,
        gain: rsu.antenna_gain ?? 0,
        polarization: rsu.polarization ?? 'vertical',
        orientation: { azimuth: rsu.azimuth ?? 0, tilt: rsu.tilt ?? 0 },
        array: { rows: rsu.mimo_rows ?? 1, columns: rsu.mimo_columns ?? 1, element_spacing: rsu.element_spacing ?? 0.5 },
      },
    })),
    receivers: cars.map((car, i) => ({
      name: `vehicle_${i}`,
      position: [+car.x.toFixed(2), +car.y.toFixed(2), +car.z.toFixed(2)],
    })),
    buildings: buildings.map((b, i) => ({
      name: b.name || `building_${i}`,
      position: [+b.x.toFixed(2), +b.y.toFixed(2), +b.z.toFixed(2)],
      width: b.width ?? 20,
      depth: b.depth ?? 20,
      height: b.height,
      material: b.material,
    })),
    ray_tracing: {
      method: 'fibonacci',
      num_samples: config.sionna.num_samples,
      max_depth: config.sionna.max_depth,
      los: config.sionna.los,
      reflection: config.sionna.reflection,
      diffraction: config.sionna.diffraction,
      scattering: config.sionna.scattering,
    },
  };
}
