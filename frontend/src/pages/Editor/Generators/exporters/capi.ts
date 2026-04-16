import { mergeSimConfigWithDefaults, type SimulationConfig } from '../types/configGeneratorsTypes';

export function generateCAPIomnetIni(config: SimulationConfig): string {
  const c = mergeSimConfigWithDefaults(config).capi;

  const extraConfigSections = c.extra_configs.map(ec => `
[Config ${ec.name}]
*.radioMedium.pathLossType = "${ec.path_loss_type}"
*.radioMedium.pathLoss.withSmallScaleVariations = ${ec.small_scale_variations}
*.radioMedium.pathLoss.withVisualization = ${ec.visualization}`).join('\n');

  return `[General]
network = ${c.network}
cmdenv-express-mode = ${c.cmdenv_express_mode}
cmdenv-output-file = "${c.cmdenv_output_file}"
*.withCAPI = true
*.capi.cmdenv-log-level = ${c.capi_log_level}
**.cmdenv-log-level = warn
**.scalar-recording = ${c.scalar_recording}
**.vector-recording = ${c.vector_recording}

*.traci.core.version = -1
*.traci.launcher.typename = "ConnectLauncher"
*.traci.launcher.hostname = "${c.traci_hostname}"
*.traci.launcher.port = ${c.traci_port}
*.traci.launcher.clientId = ${c.client_id}

*.capi.address = "${c.address}"

*.node[*].wlan[*].typename = "VanetNic"
*.node[*].wlan[*].radio.channelNumber = ${c.channel_number}
*.node[*].wlan[*].radio.carrierFrequency = ${c.carrier_frequency}
*.node[*].wlan[*].radio.transmitter.power = ${c.tx_power}

*.node[*].middleware.updateInterval = ${c.middleware_update_interval}s
*.node[*].middleware.datetime = "${c.datetime}"
*.node[*].middleware.services = xmldoc("services.xml")
${extraConfigSections}`;
}

export function generateCAPIServicesXml(config: SimulationConfig): string {
  const c = mergeSimConfigWithDefaults(config).capi;
  const services: string[] = [];

  if (c.ca_service_enabled) {
    services.push(`\t<service type="artery.application.CaService">
\t\t<listener port="${c.ca_service_port}"/>
\t</service>`);
  }

  if (c.cosim_service_enabled) {
    services.push(`\t<service type="cavise.application.CosimService">
\t\t<listener port="${c.cosim_service_port}"/>
\t\t<filters>
\t\t    <name pattern="${c.cosim_filter_pattern}"/>
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
