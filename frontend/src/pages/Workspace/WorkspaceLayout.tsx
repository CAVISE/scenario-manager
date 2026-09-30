import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  HomeOutlined,
  FolderOutlined,
  SettingsOutlined,
  PlayCircleOutline,
  ViewInArOutlined,
} from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import { useAuth } from '@/features/auth';
import './Workspace.scss';

export default function WorkspaceLayout() {
  useSimulationSocket();
  const { user, logout } = useAuth();
  const name = useEditorStore((state) => state.Scenario.name);
  return (
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <Link to="/" className="workspace-brand">
          <ViewInArOutlined />
          Scenario Manager
        </Link>
        <div className="workspace-topbar-actions">
          <Link to="/editor" className="workspace-current">
            {name || 'Untitled scenario'} <span>Open editor →</span>
          </Link>
          {user.authentication_enabled ? (
            <button
              type="button"
              className="workspace-account"
              onClick={() => void logout()}
            >
              <span>{user.email}</span>
              <small>{user.role} · Sign out</small>
            </button>
          ) : (
            <span className="workspace-account workspace-account--development">
              <span>Development access</span>
              <small>Authentication is disabled</small>
            </span>
          )}
        </div>
      </header>
      <aside className="workspace-sidebar">
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <HomeOutlined />
            Home
          </NavLink>
          <NavLink to="/scenarios">
            <FolderOutlined />
            Scenarios
          </NavLink>
          <NavLink to="/settings">
            <SettingsOutlined />
            Settings
          </NavLink>
          <NavLink to="/runs">
            <PlayCircleOutline />
            Runs
          </NavLink>
        </nav>
        <span className="workspace-sidebar-footer">V2X scenario workspace</span>
      </aside>
      <div className="workspace-content">
        <Outlet />
      </div>
    </div>
  );
}
