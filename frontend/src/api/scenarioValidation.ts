import {
  ALLOWED_VEHICLES,
  MAX_DESCRIPTION_LEN,
  MAX_NAME_LEN,
  MAX_OPENDRIVE_LEN,
  MAX_PREVIEW_LEN,
  SCENARIO_ID_RE,
  ValidationResult,
  type ScenarioGroup,
  type ScenarioPayload,
} from './scenario.types';
import type { StartSimulationPayload } from '../pages/editor/hooks/useSimulationMutation.types';
import { scenarioGroupsFromPayload } from './scenarioRequest';

export function validateScenarioId(
  id: string | null | undefined,
  { required = false }: { required?: boolean } = {},
): ValidationResult {
  const trimmed = id?.trim() ?? '';
  if (!trimmed) {
    return required
      ? { ok: false, message: 'Scenario ID is required.' }
      : { ok: true };
  }
  if (!SCENARIO_ID_RE.test(trimmed)) {
    return {
      ok: false,
      message:
        'Scenario ID must start with a letter or digit and contain only letters, digits, _ and - (max 128).',
    };
  }
  return { ok: true };
}

export function validateScenarioName(
  name: string | null | undefined,
): ValidationResult {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, message: 'Scenario name is required.' };
  }
  if (trimmed.length > MAX_NAME_LEN) {
    return {
      ok: false,
      message: `Scenario name is too long (max ${MAX_NAME_LEN} characters).`,
    };
  }
  return { ok: true };
}

function validateDescription(
  text: string | null | undefined,
): ValidationResult {
  if (text && text.length > MAX_DESCRIPTION_LEN) {
    return {
      ok: false,
      message: `Description is too long (max ${MAX_DESCRIPTION_LEN} characters).`,
    };
  }
  return { ok: true };
}

function validateOpenDrive(
  fileContent: string | null | undefined,
): ValidationResult {
  if (!fileContent) return { ok: true };
  if (fileContent.length > MAX_OPENDRIVE_LEN) {
    return {
      ok: false,
      message: `OpenDRIVE map is too large (max ${MAX_OPENDRIVE_LEN} characters).`,
    };
  }
  if (!/<\s*OpenDRIVE[\s>]/i.test(fileContent)) {
    return {
      ok: false,
      message: 'Map file must contain OpenDRIVE XML.',
    };
  }
  return { ok: true };
}

function validatePreview(preview: string | null | undefined): ValidationResult {
  if (preview && preview.length > MAX_PREVIEW_LEN) {
    return {
      ok: false,
      message: `Preview image is too large (max ${MAX_PREVIEW_LEN} characters).`,
    };
  }
  return { ok: true };
}

function validateScenarioGroups(groups: ScenarioGroup[]): ValidationResult {
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    if (!ALLOWED_VEHICLES.has(group.vehicle)) {
      return {
        ok: false,
        message: `Unknown vehicle type in group ${i + 1}: ${group.vehicle}`,
      };
    }
    for (let j = 0; j < group.path.length; j++) {
      const item = group.path[j];
      for (const coord of ['x', 'y', 'z'] as const) {
        const value = item[coord];
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          return {
            ok: false,
            message: `Group ${i + 1}, item ${j + 1}: coordinate "${coord}" must be a number.`,
          };
        }
      }
    }
  }
  return { ok: true };
}

function firstFailure(...checks: ValidationResult[]): ValidationResult {
  return checks.find((c) => !c.ok) ?? { ok: true };
}

export function validateUploadPayload(
  payload: ScenarioPayload,
  scenarioIdInput = '',
): ValidationResult {
  const scenarioId =
    scenarioIdInput.trim() || payload.scenario_id?.trim() || '';
  return firstFailure(
    validateScenarioId(scenarioId),
    validateScenarioName(payload.name_of_scenario),
    validateDescription(payload.description),
    validateOpenDrive(payload.file_),
    validatePreview(payload.preview),
    validateScenarioGroups(scenarioGroupsFromPayload(payload.scenario)),
  );
}

export function validateUpdatePayload(
  scenarioId: string,
  payload: Partial<ScenarioPayload>,
): ValidationResult {
  return firstFailure(
    validateScenarioId(scenarioId, { required: true }),
    payload.name_of_scenario != null
      ? validateScenarioName(payload.name_of_scenario)
      : { ok: true },
    validateDescription(payload.description),
    validateOpenDrive(payload.file_ ?? null),
    validatePreview(payload.preview),
    payload.scenario != null
      ? validateScenarioGroups(scenarioGroupsFromPayload(payload.scenario))
      : { ok: true },
  );
}

export function validateDeletePayload(scenarioId: string): ValidationResult {
  return validateScenarioId(scenarioId, { required: true });
}

export function validateStartSimulationPayload(
  payload: StartSimulationPayload,
): ValidationResult {
  const map = payload.map?.trim() ?? '';
  if (!map) {
    return { ok: false, message: 'Map is required to start simulation.' };
  }
  if (map.length > 128) {
    return { ok: false, message: 'Map name is too long (max 128 characters).' };
  }
  if (!payload.opencda_config_yaml?.trim()) {
    return {
      ok: false,
      message: 'OpenCDA YAML is required to start simulation.',
    };
  }
  if (!payload.xodr?.trim()) {
    return {
      ok: false,
      message: 'OpenDRIVE map failed to load — try selecting the map again.',
    };
  }

  const groups = payload.scenario ?? [];
  const cars = groups.filter((g) => g.vehicle === 'car');
  if (cars.length === 0) {
    return {
      ok: false,
      message: 'Add at least one vehicle before starting simulation.',
    };
  }

  const hasRoute = cars.some((group) =>
    group.path.some(
      (car) => Array.isArray(car.points) && car.points.length > 0,
    ),
  );
  if (!hasRoute) {
    return {
      ok: false,
      message: 'Add route points to at least one vehicle.',
    };
  }

  return firstFailure(
    validateDescription(payload.description),
    validateOpenDrive(payload.xodr),
    validateScenarioGroups(groups),
    payload.scenario_id
      ? validateScenarioId(payload.scenario_id)
      : { ok: true },
  );
}
