import type { ScenarioGroup, ScenarioPayload } from './types/IScenarioTypes';
import type { StartSimulationPayload } from '../pages/Editor/hooks/useApiHooks/useSimulationMutation/types/useSimulationMutationTypes';
import { scenarioGroupsFromPayload } from './scenarioRequest';

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

const SCENARIO_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
const MAX_NAME_LEN = 200;
const MAX_DESCRIPTION_LEN = 4000;
const MAX_PREVIEW_LEN = 500_000;
const MAX_FILE_REF_LEN = 512;
const ALLOWED_VEHICLES = new Set(['car', 'RSU', 'building', 'pedestrian']);

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

function validateDescription(text: string | null | undefined): ValidationResult {
  if (text && text.length > MAX_DESCRIPTION_LEN) {
    return {
      ok: false,
      message: `Description is too long (max ${MAX_DESCRIPTION_LEN} characters).`,
    };
  }
  return { ok: true };
}

function validateFileRef(fileRef: string | null | undefined): ValidationResult {
  if (!fileRef) return { ok: true };
  if (fileRef.length > MAX_FILE_REF_LEN) {
    return {
      ok: false,
      message: `Map reference is too long (max ${MAX_FILE_REF_LEN} characters).`,
    };
  }
  if (/<\s*OpenDRIVE/i.test(fileRef) || fileRef.includes('\n')) {
    return {
      ok: false,
      message: 'Map reference must be a file name, not OpenDRIVE XML.',
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
        if (typeof value !== 'number' || Number.isNaN(value)) {
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
  const scenarioId = scenarioIdInput.trim() || payload.scenario_id?.trim() || '';
  return firstFailure(
    validateScenarioId(scenarioId),
    validateScenarioName(payload.name_of_scenario),
    validateDescription(payload.description),
    validateFileRef(payload.file_),
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
    validateFileRef(payload.file_ ?? null),
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
    validateScenarioGroups(groups),
    payload.scenario_id
      ? validateScenarioId(payload.scenario_id)
      : { ok: true },
  );
}
