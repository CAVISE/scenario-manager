import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';

export function EditorPreferencesCard() {
  const preferences = useWorkspacePreferences();
  return (
    <div className="workspace-settings-card">
      <h2>Editor</h2>
      <p className="workspace-settings-card__hint">
        Control selections and placement while building a scenario.
      </p>
      <Toggle
        label="Focus the camera when selecting in Scene Graph"
        checked={preferences.focusOnSelection}
        onChange={(focusOnSelection) =>
          preferences.update({ focusOnSelection })
        }
      />
      <Toggle
        label="Show selection outlines in 3D"
        checked={preferences.showSelectionOutline}
        onChange={(showSelectionOutline) =>
          preferences.update({ showSelectionOutline })
        }
      />
      <Toggle
        label="Show editor grid"
        checked={preferences.showGrid}
        onChange={(showGrid) => preferences.update({ showGrid })}
      />
      <Toggle
        label="Show routes and waypoint markers"
        checked={preferences.showRoutes}
        onChange={(showRoutes) => preferences.update({ showRoutes })}
      />
      <Toggle
        label="Show lidar coverage"
        checked={preferences.showLidarCoverage}
        onChange={(showLidarCoverage) =>
          preferences.update({ showLidarCoverage })
        }
      />
      <Toggle
        label="Performance mode for large maps"
        checked={preferences.reduceVisualLoad}
        onChange={(reduceVisualLoad) =>
          preferences.update({ reduceVisualLoad })
        }
      />
      <Toggle
        label="Use compact editor layout"
        checked={preferences.compactEditor}
        onChange={(compactEditor) => preferences.update({ compactEditor })}
      />
      <Toggle
        label="Snap movement to grid"
        checked={preferences.snapToGrid}
        onChange={(snapToGrid) => preferences.update({ snapToGrid })}
      />
      <Select
        label="Grid step"
        value={preferences.gridSnapStep}
        disabled={!preferences.snapToGrid}
        onChange={(gridSnapStep) => preferences.update({ gridSnapStep })}
        options={[
          [0.1, '0.1 m'],
          [0.5, '0.5 m'],
          [1, '1 m'],
          [2, '2 m'],
        ]}
      />
      <Toggle
        label="Keep objects on road surface"
        checked={preferences.snapToRoad}
        onChange={(snapToRoad) => preferences.update({ snapToRoad })}
      />
      <Toggle
        label="Snap rotation"
        checked={preferences.snapRotation}
        onChange={(snapRotation) => preferences.update({ snapRotation })}
      />
      <Select
        label="Rotation step"
        value={preferences.rotationSnapDegrees}
        disabled={!preferences.snapRotation}
        onChange={(rotationSnapDegrees) =>
          preferences.update({ rotationSnapDegrees })
        }
        options={[
          [5, '5°'],
          [15, '15°'],
          [45, '45°'],
          [90, '90°'],
        ]}
      />
      <Toggle
        label="Align vehicle to its first waypoint"
        checked={preferences.alignVehiclesToRoute}
        onChange={(alignVehiclesToRoute) =>
          preferences.update({ alignVehiclesToRoute })
        }
      />
      <Select
        label="Duplicate offset"
        value={preferences.duplicateOffset}
        onChange={(duplicateOffset) => preferences.update({ duplicateOffset })}
        options={[
          [0.5, '0.5 m'],
          [1, '1 m'],
          [2, '2 m'],
          [5, '5 m'],
        ]}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="workspace-setting">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  options: readonly (readonly [number, string])[];
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="workspace-setting">
      <span>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
