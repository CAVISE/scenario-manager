import { useState } from 'react';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import SimConfigModal from '@editor/components/SimConfigModal';
import { useEditorStore } from '@/store';

export default function SettingsPage() {
  const preferences = useWorkspacePreferences();
  const [simulationOpen, setSimulationOpen] = useState(false);
  const scenarioName = useEditorStore((state) => state.Scenario.name);
  const running = useEditorStore(
    (state) => state.simulationSession.phase === 'running'
  );
  return (
    <section>
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">PREFERENCES</span>
          <h1>Settings</h1>
          <p>Preferences are saved on this device.</p>
        </div>
      </div>
      <div className="workspace-settings-card">
        <h2>Appearance</h2>
        <label className="workspace-setting">
          <span>Theme</span>
          <select
            value={preferences.theme}
            onChange={(event) =>
              preferences.update({
                theme: event.target.value as typeof preferences.theme,
              })
            }
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </label>
      </div>
      <div className="workspace-settings-card">
        <h2>Editor</h2>
        <label className="workspace-setting">
          <span>Focus the camera when selecting in Scene Graph</span>
          <input
            type="checkbox"
            checked={preferences.focusOnSelection}
            onChange={(event) =>
              preferences.update({ focusOnSelection: event.target.checked })
            }
          />
        </label>
        <label className="workspace-setting">
          <span>Show selection outlines in 3D</span>
          <input
            type="checkbox"
            checked={preferences.showSelectionOutline}
            onChange={(event) =>
              preferences.update({ showSelectionOutline: event.target.checked })
            }
          />
        </label>
      </div>
      <div className="workspace-settings-card">
        <h2>Current scenario</h2>
        <p>{scenarioName || 'Untitled scenario'}</p>
        <button
          type="button"
          disabled={running}
          onClick={() => setSimulationOpen(true)}
        >
          Simulation parameters
        </button>
        <p className="workspace-count">
          Scenario parameters are saved with the scenario before each run.
        </p>
      </div>
      <SimConfigModal
        open={simulationOpen && !running}
        onClose={() => setSimulationOpen(false)}
      />
    </section>
  );
}
