import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useGenerateCAPIomnetIni,
  useGenerateCAPIServicesXml,
  generateCAPISensorsXml,
} from './capi';
import { defaultSimConfig } from '../../types/configGeneratorsTypes';
import type { SimulationConfig } from '../../types/configGeneratorsTypes';

const renderOmnetIni = (config: SimulationConfig) =>
  renderHook(() => useGenerateCAPIomnetIni(config)).result.current;

const renderServicesXml = (config: SimulationConfig) =>
  renderHook(() => useGenerateCAPIServicesXml(config)).result.current;

describe('useGenerateCAPIomnetIni', () => {
  it('renders general and traci fields from config.capi', () => {
    const ini = renderOmnetIni(defaultSimConfig);

    expect(ini).toContain(`network = ${defaultSimConfig.capi.network}`);
    expect(ini).toContain(
      `cmdenv-express-mode = ${defaultSimConfig.capi.cmdenv_express_mode}`
    );
    expect(ini).toContain(
      `cmdenv-output-file = "${defaultSimConfig.capi.cmdenv_output_file}"`
    );
    expect(ini).toContain(
      `*.capi.cmdenv-log-level = ${defaultSimConfig.capi.capi_log_level}`
    );
    expect(ini).toContain(
      `**.scalar-recording = ${defaultSimConfig.capi.scalar_recording}`
    );
    expect(ini).toContain(
      `**.vector-recording = ${defaultSimConfig.capi.vector_recording}`
    );
    expect(ini).toContain(
      `*.traci.launcher.hostname = "${defaultSimConfig.capi.traci_hostname}"`
    );
    expect(ini).toContain(
      `*.traci.launcher.port = ${defaultSimConfig.capi.traci_port}`
    );
    expect(ini).toContain(
      `*.traci.launcher.clientId = ${defaultSimConfig.capi.client_id}`
    );
    expect(ini).toContain(
      `*.capi.address = "${defaultSimConfig.capi.address}"`
    );
  });

  it('renders radio and middleware fields from config.capi', () => {
    const ini = renderOmnetIni(defaultSimConfig);

    expect(ini).toContain(
      `*.node[*].wlan[*].radio.channelNumber = ${defaultSimConfig.capi.channel_number}`
    );
    expect(ini).toContain(
      `*.node[*].wlan[*].radio.carrierFrequency = ${defaultSimConfig.capi.carrier_frequency}`
    );
    expect(ini).toContain(
      `*.node[*].wlan[*].radio.transmitter.power = ${defaultSimConfig.capi.tx_power}`
    );
    expect(ini).toContain(
      `*.node[*].middleware.updateInterval = ${defaultSimConfig.capi.middleware_update_interval}s`
    );
    expect(ini).toContain(
      `*.node[*].middleware.datetime = "${defaultSimConfig.capi.datetime}"`
    );
  });

  it('renders one [Config <name>] block per extra_configs entry', () => {
    const config = {
      ...defaultSimConfig,
      capi: {
        ...defaultSimConfig.capi,
        extra_configs: [
          {
            name: 'gemv2',
            path_loss_type: 'Gemv2',
            small_scale_variations: false,
            visualization: true,
          },
          {
            name: 'freespace',
            path_loss_type: 'FreeSpace',
            small_scale_variations: true,
            visualization: false,
          },
        ],
      },
    };

    const ini = renderOmnetIni(config);

    expect(ini).toContain('[Config gemv2]');
    expect(ini).toContain('*.radioMedium.pathLossType = "Gemv2"');
    expect(ini).toContain(
      '*.radioMedium.pathLoss.withSmallScaleVariations = false'
    );
    expect(ini).toContain('*.radioMedium.pathLoss.withVisualization = true');

    expect(ini).toContain('[Config freespace]');
    expect(ini).toContain('*.radioMedium.pathLossType = "FreeSpace"');
    expect(ini).toContain(
      '*.radioMedium.pathLoss.withSmallScaleVariations = true'
    );
    expect(ini).toContain('*.radioMedium.pathLoss.withVisualization = false');
  });

  it('renders no [Config] block when extra_configs is empty', () => {
    const config = {
      ...defaultSimConfig,
      capi: { ...defaultSimConfig.capi, extra_configs: [] },
    };

    const ini = renderOmnetIni(config);

    expect(ini).not.toContain('[Config ');
  });
});

describe('useGenerateCAPIServicesXml', () => {
  it('includes only CaService when cosim is disabled', () => {
    const config = {
      ...defaultSimConfig,
      capi: {
        ...defaultSimConfig.capi,
        ca_service_enabled: true,
        cosim_service_enabled: false,
      },
    };

    const xml = renderServicesXml(config);

    expect(xml).toContain('artery.application.CaService');
    expect(xml).toContain(`port="${config.capi.ca_service_port}"`);
    expect(xml).not.toContain('cavise.application.CosimService');
  });

  it('includes only CosimService (with filter pattern) when ca_service is disabled', () => {
    const config = {
      ...defaultSimConfig,
      capi: {
        ...defaultSimConfig.capi,
        ca_service_enabled: false,
        cosim_service_enabled: true,
        cosim_filter_pattern: '(cav|rsu)-.*',
      },
    };

    const xml = renderServicesXml(config);

    expect(xml).not.toContain('artery.application.CaService');
    expect(xml).toContain('cavise.application.CosimService');
    expect(xml).toContain(`port="${config.capi.cosim_service_port}"`);
    expect(xml).toContain('pattern="(cav|rsu)-.*"');
  });

  it('includes neither service when both flags are disabled', () => {
    const config = {
      ...defaultSimConfig,
      capi: {
        ...defaultSimConfig.capi,
        ca_service_enabled: false,
        cosim_service_enabled: false,
      },
    };

    const xml = renderServicesXml(config);

    expect(xml).not.toContain('artery.application.CaService');
    expect(xml).not.toContain('cavise.application.CosimService');
    expect(xml).toContain('<services>');
    expect(xml).toContain('</services>');
  });

  it('includes both services when both flags are enabled', () => {
    const config = {
      ...defaultSimConfig,
      capi: {
        ...defaultSimConfig.capi,
        ca_service_enabled: true,
        cosim_service_enabled: true,
      },
    };

    const xml = renderServicesXml(config);

    expect(xml).toContain('artery.application.CaService');
    expect(xml).toContain('cavise.application.CosimService');
  });

  it('always includes the XML declaration and root element', () => {
    const xml = renderServicesXml(defaultSimConfig);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml.trim().startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<services>');
    expect(xml).toContain('</services>');
  });
});

describe('generateCAPISensorsXml', () => {
  it('returns a fixed, empty <sensors> document regardless of input', () => {
    const xml = generateCAPISensorsXml();

    expect(xml).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<sensors>\n</sensors>'
    );
  });
});
