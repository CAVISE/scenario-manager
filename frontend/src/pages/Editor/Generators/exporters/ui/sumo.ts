import {
  mergeSimConfigWithDefaults,
  type SimulationConfig,
} from '../../types/configGeneratorsTypes';
import type {
  Building,
  Car,
} from '../../../../../store/types/useEditorStoreTypes';

export function generateSumoCfg(config: SimulationConfig): string {
  const cfg = mergeSimConfigWithDefaults(config);
  const { scenario_name, net_file, full_output } = cfg.sumo;
  return `<?xml version='1.0' encoding='UTF-8'?>
<configuration>
  <input>
    <net-file value="${net_file}"/>
    <route-files value="${scenario_name}.rou.xml"/>
    <additional-files value="${scenario_name}.poly.xml"/>
  </input>${
    full_output
      ? `
  <output>
    <full-output value="sumo_full_output.xml"/>
  </output>`
      : ''
  }
  <time>
    <step-length value="${cfg.artery.sumo_step_length}"/>
  </time>
  <num-clients value="1"/>
</configuration>`;
}

export function generateRouXml(config: SimulationConfig, cars: Car[]): string {
  const cfg = mergeSimConfigWithDefaults(config);
  const vtypeLines = cfg.sumo.vtypes
    .map(
      (vt) =>
        `  <vType id="${vt.id}" minGap="${vt.minGap}" tau="${vt.tau}" vClass="${vt.vClass}" carFollowModel="${vt.carFollowModel}" speedFactor="${vt.speedFactor}"/>`,
    )
    .join('\n');

  const vehicleLines = cars
    .map((car, i) => {
      const maxSpeed = car.sumo_max_speed ?? 16.665;
      const depart = car.sumo_depart ?? 0.05;
      const dLane = car.sumo_depart_lane
        ? ` departLane="${car.sumo_depart_lane}"`
        : '';
      const dPos =
        car.sumo_depart_pos != null
          ? ` departPos="${car.sumo_depart_pos}"`
          : '';
      const type = car.sumo_vtype ? ` type="${car.sumo_vtype}"` : '';
      const stop = car.sumo_stop
        ? `\n    <stop lane="${car.sumo_stop.lane}" startPos="${car.sumo_stop.startPos}" endPos="${car.sumo_stop.endPos}" duration="${car.sumo_stop.duration}"/>`
        : '';
      return `  <vehicle id="sumo${i}"${type} maxSpeed="${maxSpeed}" depart="${depart}"${dLane}${dPos} departSpeed="0.00">
    <route edges="${car.sumo_edges ?? ''}"/>${stop}
  </vehicle>`;
    })
    .join('\n');

  return `<?xml version='1.0' encoding='UTF-8'?>
<routes>
${vtypeLines ? vtypeLines + '\n' : ''}${vehicleLines}
</routes>`;
}

export function generatePolyXml(buildings: Building[]): string {
  const polyLines = buildings
    .map((b, i) => {
      const hw = (b.width ?? 20) / 2;
      const hd = (b.depth ?? 20) / 2;
      const shape = [
        `${(b.x - hw).toFixed(6)},${(b.y - hd).toFixed(6)}`,
        `${(b.x + hw).toFixed(6)},${(b.y - hd).toFixed(6)}`,
        `${(b.x + hw).toFixed(6)},${(b.y + hd).toFixed(6)}`,
        `${(b.x - hw).toFixed(6)},${(b.y + hd).toFixed(6)}`,
        `${(b.x - hw).toFixed(6)},${(b.y - hd).toFixed(6)}`,
      ].join(' ');
      return `  <poly id="${b.name || `building_${i}`}" type="building" color="172,187,173" fill="1" layer="0.00" shape="${shape}"/>`;
    })
    .join('\n');

  return `<?xml version='1.0' encoding='UTF-8'?>
<additional xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://sumo.dlr.de/xsd/additional_file.xsd">
${polyLines}
</additional>`;
}
