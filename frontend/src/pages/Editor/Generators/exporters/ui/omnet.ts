import type { SimulationConfig } from '../../types/configGeneratorsTypes';
import type { Car, Pedestrian, RSU } from '@/store/types/useEditorStoreTypes';

export function generateOmnetConfig(
  config: SimulationConfig,
  RSUs: RSU[],
  cars: Car[],
  pedestrians: Pedestrian[] = []
): string {
  const rsuLines = RSUs.map(
    (rsu, i) => `
*.rsu[${i}].mobility.x = ${rsu.x.toFixed(1)}
*.rsu[${i}].mobility.y = ${rsu.y.toFixed(1)}
*.rsu[${i}].mobility.z = ${rsu.z.toFixed(1)}
*.rsu[${i}].appl.txPower = ${rsu.tx_power}dBm
*.rsu[${i}].appl.communicationRange = ${rsu.range}m`
  ).join('\n');

  const pedestrianLines = pedestrians
    .map(
      (ped, i) => `
*.pedestrian[${i}].mobility.x = ${ped.x.toFixed(1)}
*.pedestrian[${i}].mobility.y = ${ped.y.toFixed(1)}
*.pedestrian[${i}].mobility.z = ${ped.z.toFixed(1)}
*.pedestrian[${i}].appl.txPower = ${ped.tx_power}dBm
*.pedestrian[${i}].appl.beaconInterval = ${ped.beacon_interval}ms`
    )
    .join('\n');

  return `[General]
network = V2XScenario
sim-time-limit = ${config.sim_duration}s
debug-on-errors = true

*.playgroundSizeX = 5000m
*.playgroundSizeY = 5000m
*.playgroundSizeZ = 50m

*.connectionManager.sendDirect = true
*.connectionManager.maxInterfDist = ${config.omnet.max_interf_dist}m
*.connectionManager.drawMaxInterfDist = false

*.node[*].nic.mac1609_4.txPower = ${config.omnet.tx_power}dBm
*.node[*].nic.mac1609_4.bitrate = ${config.omnet.bitrate}Mbps
*.node[*].nic.phy80211p.sensitivity = -89dBm
*.node[*].nic.phy80211p.useThermalNoise = true
*.node[*].nic.phy80211p.thermalNoise = -110dBm
*.node[*].nic.phy80211p.decider = xmldoc("config.xml")
*.node[*].nic.phy80211p.analogueModels = xmldoc("config.xml")

*.node[*].appl.headerLength = 80 bit
*.node[*].appl.beaconInterval = ${config.omnet.beaconing_interval}ms
*.node[*].appl.dataOnSch = false
*.node[*].nic.mac1609_4.useServiceChannel = ${config.omnet.protocol === 'ITS-G5' ? 'false' : 'true'}

**.numVehicles = ${cars.length}
**.numRSU = ${RSUs.length}
${rsuLines}

**.numPedestrian = ${pedestrians.length}
${pedestrianLines}
`;
}
