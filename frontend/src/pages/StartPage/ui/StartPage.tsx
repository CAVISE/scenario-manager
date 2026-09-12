import { Link } from 'react-router-dom';
import { useScenarioManager } from '../hooks/useScenarioManager';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { ScenarioCards } from '../../Workspace/ScenarioCards';
import {
  AddCircleOutline,
  FolderOpenOutlined,
  MapOutlined,
  ViewInArOutlined,
} from '@mui/icons-material';

export default function StartPage() {
  const manager = useScenarioManager();
  const recentIds = useWorkspacePreferences((state) => state.recentScenarioIds);
  const recent = [...manager.scenarios]
    .sort((a, b) => {
      const left = recentIds.indexOf(a.scenario_id),
        right = recentIds.indexOf(b.scenario_id);
      if (left !== -1 || right !== -1)
        return (
          (left === -1 ? Infinity : left) - (right === -1 ? Infinity : right)
        );
      return b.id - a.id;
    })
    .slice(0, 5);
  return (
    <section>
      <div className="workspace-page-heading">
        <div>
          <span className="workspace-kicker">SCENARIO WORKSPACE</span>
          <h1>Welcome to Scenario Manager</h1>
          <p>Create, edit and run V2X scenarios.</p>
        </div>
      </div>
      <div className="workspace-action-grid">
        <button type="button" onClick={manager.handleCreateNew}>
          <AddCircleOutline />
          <strong>Create scenario</strong>
          <span>Start with an empty scene</span>
        </button>
        <Link to="/scenarios">
          <FolderOpenOutlined />
          <strong>Open scenario</strong>
          <span>Browse saved scenarios</span>
        </Link>
        <Link to="/editor?mapPicker=1">
          <MapOutlined />
          <strong>Choose map</strong>
          <span>Choose a CARLA road network</span>
        </Link>
        <Link to="/editor" data-testid="open-editor">
          <ViewInArOutlined />
          <strong>Continue editing</strong>
          <span>{manager.scenario.name || 'Current draft'}</span>
        </Link>
      </div>
      <div className="workspace-section-heading">
        <h2>Recent scenarios</h2>
        <Link to="/scenarios">View all →</Link>
      </div>
      <ScenarioCards
        items={recent}
        currentId={manager.scenario.id}
        onOpen={manager.handleOpen}
        isLoading={manager.isLoading}
        error={manager.error}
        onRetry={manager.refetch}
      />
    </section>
  );
}
