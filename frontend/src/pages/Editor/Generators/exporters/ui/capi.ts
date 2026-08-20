import { useMemo } from 'react';
import {
  mergeSimConfigWithDefaults,
  type SimulationConfig,
} from '../../types/configGeneratorsTypes';

export function useGenerateCAPIomnetIni(config: SimulationConfig): string {
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(config).capi,
    [config]
  );

  const extraConfigSections = simConfig.extra_configs
    .map(
      (ec) => `
[Config ${ec.name}]
*.radioMedium.pathLossType = "${ec.path_loss_type}"
*.radioMedium.pathLoss.withSmallScaleVariations = ${ec.small_scale_variations}
*.radioMedium.pathLoss.withVisualization = ${ec.visualization}`
    )
    .join('\n');

  return `[General]
network = ${simConfig.network}
cmdenv-express-mode = ${simConfig.cmdenv_express_mode}
cmdenv-output-file = "${simConfig.cmdenv_output_file}"
*.withCAPI = true
*.capi.cmdenv-log-level = ${simConfig.capi_log_level}
**.cmdenv-log-level = warn
**.scalar-recording = ${simConfig.scalar_recording}
**.vector-recording = ${simConfig.vector_recording}

*.traci.core.version = -1
*.traci.launcher.typename = "ConnectLauncher"
*.traci.launcher.hostname = "${simConfig.traci_hostname}"
*.traci.launcher.port = ${simConfig.traci_port}
*.traci.launcher.clientId = ${simConfig.client_id}

*.capi.address = "${simConfig.address}"

*.node[*].wlan[*].typename = "VanetNic"
*.node[*].wlan[*].radio.channelNumber = ${simConfig.channel_number}
*.node[*].wlan[*].radio.carrierFrequency = ${simConfig.carrier_frequency}
*.node[*].wlan[*].radio.transmitter.power = ${simConfig.tx_power}

*.node[*].middleware.updateInterval = ${simConfig.middleware_update_interval}s
*.node[*].middleware.datetime = "${simConfig.datetime}"
*.node[*].middleware.services = xmldoc("services.xml")
${extraConfigSections}`;
}

export function useGenerateCAPIServicesXml(config: SimulationConfig): string {
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(config).capi,
    [config]
  );
  const services: string[] = [];

  if (simConfig.ca_service_enabled) {
    services.push(`\t<service type="artery.application.CaService">
\t\t<listener port="${simConfig.ca_service_port}"/>
\t</service>`);
  }

  if (simConfig.cosim_service_enabled) {
    services.push(`\t<service type="cavise.application.CosimService">
\t\t<listener port="${simConfig.cosim_service_port}"/>
\t\t<filters>
\t\t    <name pattern="${simConfig.cosim_filter_pattern}"/>
\t\t</filters>
\t</service>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<services>
${services.join('\n')}
</services>`;
}

export function generateCAPISensorsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sensors>
</sensors>`;
}
