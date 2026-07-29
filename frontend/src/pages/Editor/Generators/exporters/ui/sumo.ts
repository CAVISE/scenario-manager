import {
  mergeSimConfigWithDefaults,
  type SimulationConfig,
} from '../../types/configGeneratorsTypes';
import type {
  Building,
  Car,
} from '../../../../../store/types/useEditorStoreTypes';
import type { GeneratedSumoRoutes } from './sumoNetwork';

function xmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sumoArtifactBaseName(
  outputFilename: string | undefined,
  fallback: string,
): string {
  const filename = outputFilename?.trim();
  if (!filename) return fallback.trim() || 'scenario';

  const basename = filename.replace(/^.*[/\\]/, '').replace(/\.sumocfg$/i, '');
  return basename.trim() || fallback.trim() || 'scenario';
}

function sumoMapBaseName(map: string): string {
  const mapName = map
    .trim()
    .replace(/^.*[/\\]/, '')
    .replace(/\.net\.xml$/i, '')
    .replace(/\.xodr$/i, '');
  return mapName || 'Town03';
}

export function getSumoNetFilename(map: string): string {
  return `${sumoMapBaseName(map)}.net.xml`;
}

export function generateSumoCfg(
  config: SimulationConfig,
  outputFilename?: string,
): string {
  const cfg = mergeSimConfigWithDefaults(config);
  const { scenario_name, full_output } = cfg.sumo;
  const artifactName = xmlAttribute(
    sumoArtifactBaseName(outputFilename, scenario_name),
  );
  const netFile = xmlAttribute(getSumoNetFilename(cfg.carla.map));
  return `<?xml version='1.0' encoding='UTF-8'?>
<configuration>
  <input>
    <net-file value="./${netFile}"/>
    <route-files value="./${artifactName}.rou.xml"/>
    <additional-files value="./${artifactName}.poly.xml"/>
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

export function generateRouXml(
  config: SimulationConfig,
  cars: Car[],
  generatedRoutes: GeneratedSumoRoutes = {},
): string {
  const cfg = mergeSimConfigWithDefaults(config);
  const vtypeLines = cfg.sumo.vtypes
    .map(
      (vt) =>
        `  <vType id="${vt.id}" minGap="${vt.minGap}" tau="${vt.tau}" vClass="${vt.vClass}" carFollowModel="${vt.carFollowModel}" speedFactor="${vt.speedFactor}"/>`,
    )
    .join('\n');

  const vehicleLines = cars
    .map((car, i) => {
      const generated = generatedRoutes[car.id];
      const edges = car.sumo_edges?.trim() || generated?.edges.trim() || '';
      if (!edges) {
        throw new Error(
          `Vehicle ${car.opencda_name || car.id} has no SUMO route`,
        );
      }
      const generatedAnchors =
        generated?.edges.trim() === edges ? generated : undefined;
      const maxSpeed = car.sumo_max_speed ?? 16.665;
      const depart = car.sumo_depart ?? 0.05;
      const dLane = car.sumo_depart_lane
        ? ` departLane="${car.sumo_depart_lane}"`
        : generatedAnchors?.depart
          ? ` departLane="${generatedAnchors.depart.laneIndex}"`
          : '';
      const dPos =
        car.sumo_depart_pos != null
          ? ` departPos="${car.sumo_depart_pos}"`
          : generatedAnchors?.depart
            ? ` departPos="${formatLanePosition(generatedAnchors.depart.pos)}"`
            : '';
      const aLane = generatedAnchors?.arrival
        ? ` arrivalLane="${generatedAnchors.arrival.laneIndex}"`
        : '';
      const aPos = generatedAnchors?.arrival
        ? ` arrivalPos="${formatLanePosition(generatedAnchors.arrival.pos)}"`
        : '';
      const type = car.sumo_vtype ? ` type="${car.sumo_vtype}"` : '';
      const stop = car.sumo_stop
        ? `\n    <stop lane="${car.sumo_stop.lane}" startPos="${car.sumo_stop.startPos}" endPos="${car.sumo_stop.endPos}" duration="${car.sumo_stop.duration}"/>`
        : '';
      return `  <vehicle id="sumo${i}"${type} maxSpeed="${maxSpeed}" depart="${depart}"${dLane}${dPos}${aLane}${aPos} departSpeed="0.00">
    <route edges="${xmlAttribute(edges)}"/>${stop}
  </vehicle>`;
    })
    .join('\n');

  return `<?xml version='1.0' encoding='UTF-8'?>
<routes>
${vtypeLines ? vtypeLines + '\n' : ''}${vehicleLines}
</routes>`;
}

function formatLanePosition(value: number): string {
  return value.toFixed(2);
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
