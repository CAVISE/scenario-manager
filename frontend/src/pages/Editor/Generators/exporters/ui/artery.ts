import type { SimulationConfig } from '../../types/configGeneratorsTypes';
import type { RSU } from '../../../../../store/types/useEditorStoreTypes';

export function generateArteryConfig(
  config: SimulationConfig,
  RSUs: RSU[],
): string {
  const vehicleServices = [
    '<service type=\\"artery.application.CaService\\"><listener port=\\"2001\\"/></service>',
    config.artery.denm_enabled
      ? '<service type=\\"artery.application.DenmService\\"><listener port=\\"2002\\"/></service>'
      : '',
    config.artery.cp_service_enabled
      ? '<service type=\\"artery.cp.CpService\\"><listener port=\\"2003\\"/></service>'
      : '',
  ]
    .filter(Boolean)
    .join('');

  const rsuLines = RSUs.map((rsu, i) => {
    const rsuServices = [
      config.artery.rsu_cam_enabled
        ? '<service type=\\"artery.application.CaService\\"><listener port=\\"2001\\"/></service>'
        : '',
      config.artery.rsu_denm_enabled
        ? '<service type=\\"artery.application.DenmService\\"><listener port=\\"2002\\"/></service>'
        : '',
    ]
      .filter(Boolean)
      .join('');
    return `
*.rsu[${i}].mobility.x = ${rsu.x.toFixed(1)}
*.rsu[${i}].mobility.y = ${rsu.y.toFixed(1)}
*.rsu[${i}].mobility.z = ${rsu.z.toFixed(1)}
*.rsu[${i}].middleware.updateInterval = ${config.artery.middleware_update_interval}ms
*.rsu[${i}].middleware.datetime = "${config.artery.datetime}"
*.rsu[${i}].middleware.services = xml("<services>${rsuServices}</services>")
*.rsu[${i}].wlan[0].radio.transmitter.power = ${rsu.tx_power}dBm
*.rsu[${i}].wlan[0].radio.centerFrequency = ${rsu.frequency}Hz
*.rsu[${i}].wlan[0].mac.bitrate = ${config.omnet.bitrate}Mbps
*.rsu[${i}].appl.communicationRange = ${rsu.range}m
*.rsu[${i}].vanetza[0].access.protocol = "${rsu.protocol}"
*.rsu[${i}].vanetza[0].network.protocol = "${rsu.network_protocol ?? 'GeoNetworking'}"
*.rsu[${i}].antenna.type = "${rsu.antenna_type ?? 'isotropic'}"
*.rsu[${i}].antenna.height = ${rsu.antenna_height ?? 5}m
*.rsu[${i}].antenna.gain = ${rsu.antenna_gain ?? 0}dBi
*.rsu[${i}].antenna.azimuth = ${rsu.azimuth ?? 0}
*.rsu[${i}].antenna.tilt = ${rsu.tilt ?? 0}
*.rsu[${i}].appl.camInterval = ${rsu.cam_interval ?? 100}ms`;
  }).join('\n');

  return `[General]
network = artery.inet.PoweredInetRadioMedium
sim-time-limit = ${config.sim_duration}s
debug-on-errors = true

*.traci.core.version = -1
*.traci.launcher.typename = "PosixLauncher"
*.traci.launcher.sumocfg = "${config.artery.sumo_config}"
*.traci.launcher.stepLength = ${config.artery.sumo_step_length}s
*.traci.launcher.seed = ${config.artery.sumo_seed}

*.node[*].middleware.updateInterval = ${config.artery.middleware_update_interval}ms
*.node[*].middleware.datetime = "${config.artery.datetime}"
*.node[*].middleware.services = xml("<services>${vehicleServices}</services>")
*.node[*].wlan[0].radio.transmitter.power = ${config.omnet.tx_power}dBm
*.node[*].wlan[0].mac.bitrate = ${config.omnet.bitrate}Mbps
*.node[*].vanetza[0].cam.minInterval = ${config.artery.cam_interval_min}ms
*.node[*].vanetza[0].cam.maxInterval = ${config.artery.cam_interval_max}ms

**.numRSU = ${RSUs.length}
${rsuLines}
`;
}
