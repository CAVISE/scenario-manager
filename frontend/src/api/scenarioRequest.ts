import type { ScenarioGroup, ScenarioPayload } from './types/IScenarioTypes';
import {
  validateUpdatePayload,
  validateUploadPayload,
} from './scenarioValidation';

export interface ScenarioMutationResponse {
  status: string;
  message: string;
  scenario_id?: string | null;
}

interface LoadScenarioApiResponse {
  status: string;
  scenario: {
    scenario_id: string;
    name_of_scenario: string | null;
    scenario_text?: ScenarioGroup[] | Record<string, unknown> | null;
    preview?: string | null;
    annotation?: string | null;
    file_?: string | null;
  };
}

export function scenarioGroupsFromPayload(
  scenario: ScenarioPayload['scenario'] | undefined,
): ScenarioGroup[] {
  if (!scenario) return [];
  if (Array.isArray(scenario)) return scenario;
  if ('scenario_text' in scenario && Array.isArray(scenario.scenario_text)) {
    return scenario.scenario_text;
  }
  return [];
}

export function scenarioToStoredJson(
  scenario: ScenarioPayload['scenario'] | undefined,
): Record<string, unknown> {
  return { scenario_text: scenarioGroupsFromPayload(scenario) };
}

const MAX_PREVIEW_CHARS = 500_000;

export function toUploadScenarioBody(
  payload: ScenarioPayload,
  scenarioIdInput = '',
) {
  const validation = validateUploadPayload(payload, scenarioIdInput);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const name = payload.name_of_scenario?.trim() ?? '';
  const preview =
    payload.preview && payload.preview.length <= MAX_PREVIEW_CHARS
      ? payload.preview
      : undefined;
  return {
    scenario_id:
      scenarioIdInput.trim() || payload.scenario_id?.trim() || undefined,
    name_of_scenario: name,
    description: payload.description ?? undefined,
    preview,
    file_: payload.file_ ?? undefined,
    scenario: scenarioToStoredJson(payload.scenario),
  };
}

export function toUpdateScenarioBody(
  payload: Partial<ScenarioPayload> & { scenario_id: string },
) {
  const validation = validateUpdatePayload(payload.scenario_id, payload);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const groups = scenarioGroupsFromPayload(payload.scenario);
  return {
    scenario_id: payload.scenario_id,
    scenario_name: payload.name_of_scenario ?? undefined,
    annotation: payload.description ?? undefined,
    preview: payload.preview ?? undefined,
    ...(groups.length > 0 ? { scenario: scenarioToStoredJson(groups) } : {}),
  };
}

export function normalizeLoadedScenario(
  row: LoadScenarioApiResponse['scenario'],
) {
  const scenarioText = row.scenario_text;
  const groups = Array.isArray(scenarioText)
    ? scenarioText
    : scenarioText &&
        typeof scenarioText === 'object' &&
        'scenario_text' in scenarioText &&
        Array.isArray(
          (scenarioText as { scenario_text: ScenarioGroup[] }).scenario_text,
        )
      ? (scenarioText as { scenario_text: ScenarioGroup[] }).scenario_text
      : [];

  return {
    scenario_id: row.scenario_id,
    name_of_scenario: row.name_of_scenario,
    description: row.annotation ?? null,
    preview: row.preview ?? null,
    file_: row.file_ ?? null,
    scenario: groups.length > 0 ? { scenario_text: groups } : undefined,
  };
}

export type { LoadScenarioApiResponse };
