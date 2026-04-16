import { buildScenarioPayload, LoadScenarioOptions } from "./scenario.load.handler";
import { Building, RSU, useEditorStore } from "../../../../../../../store/useEditorStore";
import { BuildingPath, CarPath, PedestrianPath, RSUPath } from "../types/ScenarioControlWidgetTypes";
import type { ScenarioGroup } from '../types/ScenarioControlWidgetTypes';
import { scenarioKeys, useScenarioCreateMutation, useScenarioPatchMutation, useScenarioPutMutation } from "../../../../../../Editor/hooks/useScenarioQueries";
import { scenariosApi } from "../../../../../../../api/scenarios";
import { queryClient } from "../../../../../../../api/queryClient";
import { StartSimulationPayload } from "../../../../../../Editor/hooks/types/useSimulationMutationTypes";
import { useStartSimulationMutation } from "../../../../../../Editor/hooks/useSimulationMutation";
export const handleLoad = async ({
  hasId,
  scenarioIdInput,
  sceneRef,
  buildingModelRef,
  setNotice,
  updateSceneGraph,
  loadRSURef,
}: LoadScenarioOptions) => {
  if (!hasId) return;
  try {
    const id   = scenarioIdInput.trim();
    const data = await queryClient.fetchQuery({
      queryKey: scenarioKeys.detail(id),
      queryFn:  () => scenariosApi.get(id),
    });
    const s           = useEditorStore.getState();
    const rawScenario = data.scenario as unknown as { scenario_text: ScenarioGroup<CarPath | RSUPath | BuildingPath | PedestrianPath>[] };
    const scenarioText = rawScenario?.scenario_text;

    [...s.cars].forEach(c => s.removeCar(c.id));
    const rsuCount = useEditorStore.getState().RSUs.length;
    for (let i = 0; i < rsuCount; i++) useEditorStore.getState().removeRSU(0);
    [...s.points].forEach(p => s.removePoint(p.id));
    [...s.buildings].forEach(b => s.removeBuilding(b.id));
    [...s.pedestrians].forEach(p => s.removePedestrian(p.id));

    const carGroup = scenarioText?.find(g => g.vehicle === 'car') as ScenarioGroup<CarPath> | undefined;
    if (carGroup) {
      carGroup.path.forEach((car: CarPath) => {
        const carId = s.addCar(car.x, car.y, car.z, car.model ?? 'car', car.color?.toString(16).padStart(6, '0') ?? '00ff00', 60);
        s.updateCar(carId, { scale: car.scale ?? 1, rotation: (car.rotation ?? 0) / 57.32 });
        car.points?.forEach(pt => s.addPoint(carId, pt.x, pt.y, pt.z));
        car.lidars?.forEach(l => {
          s.addLidar(carId, l.x, l.y, l.z);
          const last = useEditorStore.getState().lidars.at(-1);
          if (last) s.updateLidar(last.id, { rotation: l.rotation, range: l.range, channels: l.channels, rotation_frequency: l.rotation_frequency });
        });
      });
    }

    const rsuGroup = scenarioText?.find(g => g.vehicle === 'RSU') as ScenarioGroup<RSUPath> | undefined;
    if (rsuGroup) {
      rsuGroup.path.forEach((rsu: RSUPath) => {
        s.addRSU(rsu.x, rsu.y, rsu.z);
        const added = useEditorStore.getState().RSUs.at(-1);
        if (added) s.updateRSU(added.id, {
          tx_power:  rsu.tx_power,
          frequency: rsu.frequency,
          range:     rsu.range,
          protocol:  rsu.protocol as RSU['protocol'] | undefined,
          script:    rsu.script ?? '',
        });
      });
    }

    const pedGroup = scenarioText?.find(g => g.vehicle === 'pedestrian') as ScenarioGroup<PedestrianPath> | undefined;
    if (pedGroup) {
      pedGroup.path.forEach((p: PedestrianPath) => {
        const pedId = s.addPedestrian(p.x, p.y, p.z);
        s.updatePedestrian(pedId, {
          speed: p.speed, cross_factor: p.cross_factor,
          is_invincible: p.is_invincible, tx_power: p.tx_power,
          frequency: p.frequency, protocol: p.protocol as 'DSRC' | 'C-V2X' | undefined,
          beacon_interval: p.beacon_interval,
        });
      });
    }

    const bldGroup = scenarioText?.find(g => g.vehicle === 'building') as ScenarioGroup<BuildingPath> | undefined;
    if (bldGroup) {
      bldGroup.path.forEach((b: BuildingPath) => {
        s.addBuilding(b.x, b.y, b.z);
        const last = useEditorStore.getState().buildings.at(-1);
        if (last) s.updateBuilding(last.id, { height: b.height, material: b.material as Building['material'] | undefined });
      });

      const tryAddBuildings = (attempts = 0) => {
        const scene = sceneRef.current;
        const model = buildingModelRef.current;
        if (!scene || !model) {
          if (attempts < 10) setTimeout(() => tryAddBuildings(attempts + 1), 300);
          return;
        }
        useEditorStore.getState().buildings.forEach(b => {
          const already = scene.children.find(c => c.userData.id === b.id);
          if (already) return;
          const m = model.clone(true);
          m.userData = { type: 'building', id: b.id };
          m.position.set(b.x, b.y, b.z);
          m.rotation.y = b.rotation ?? 0;
          m.scale.setScalar(b.scale ?? 0.5);
          scene.add(m);
        });
        loadRSURef.current?.();
        updateSceneGraph();
      };
      tryAddBuildings();
    }

    const meta = data.scenario as { scenario_id?: string; name_of_scenario?: string } | undefined;
    s.updateScenario({
      id: String(meta?.scenario_id ?? id),
      name: meta?.name_of_scenario ?? '',
      weather: 'ClearNoon',
    });
    updateSceneGraph();
    setNotice('The script has been uploaded.');
  } catch (err) {
    console.error(err);
    setNotice('Failed to load script.');
  }
};

export const handleCreate = async (
  setNotice:      (value: string) => void,
  createMutation: ReturnType<typeof useScenarioCreateMutation>,
) => {
  try {
    await createMutation.mutateAsync(buildScenarioPayload());
    setNotice('Script saved (POST).');
  } catch (err) {
    console.error(err);
    setNotice('Failed to save script.');
  }
};

export const handlePatch = async (
  setNotice:       (value: string) => void,
  scenarioIdInput: string,
  hasId:           boolean,
  patchMutation:   ReturnType<typeof useScenarioPatchMutation>,
) => {
  if (!hasId) return;
  try {
    await patchMutation.mutateAsync({ id: scenarioIdInput.trim(), payload: buildScenarioPayload() });
    setNotice('The script has been updated (PATCH).');
  } catch (err) {
    console.error(err);
    setNotice('Failed to update the script (PATCH).');
  }
};

export const handleDelete = async (
  setNotice:       (value: string) => void,
  scenarioIdInput: string,
  hasId:           boolean,
  putMutation:     ReturnType<typeof useScenarioPutMutation>,
) => {
  if (!hasId) return;
  try {
    await putMutation.mutateAsync({ id: scenarioIdInput.trim(), payload: buildScenarioPayload() });
    setNotice('The script has been deleted (DELETE).');
  } catch (err) {
    console.error(err);
    setNotice('Failed to delete script (DELETE).');
  }
};

export const handleRunSimulation = (
  setNotice:       (value: string) => void,
  scenarioIdInput: string,
  startMutation:   ReturnType<typeof useStartSimulationMutation>,
) => {
  const scenario = useEditorStore.getState().Scenario;
  const payload: StartSimulationPayload = {
    scenario_id:   scenario.id || scenarioIdInput.trim() || '',
    scenario_name: scenario.name || 'Scenario',
    weather:       scenario.weather || 'ClearNoon',
    scenario:      buildScenarioPayload().scenario,
    description:   scenario.description || '',
  };
  startMutation.mutate(payload, {
    onSuccess: () => setNotice('The simulation has started.'),
    onError:   (err) => { console.error(err); setNotice('Failed to start simulation.'); },
  });
};
