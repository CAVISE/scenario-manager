import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  DashboardOutlined,
  HistoryOutlined,
  FolderOutlined,
  SettingsOutlined,
  PeopleOutlined,
  PlayCircleOutlined,
  ScienceOutlined,
  ViewInArOutlined,
  ArrowOutward,
  LogoutOutlined,
} from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import { useAuth } from '@/features/auth';
import './Workspace.scss';

export default function WorkspaceLayout() {
  useSimulationSocket();
  const { user, logout } = useAuth();
  const name = useEditorStore((state) => state.Scenario.name);
  const roleLabel =
    user.role === 'admin'
      ? 'Administrator'
      : user.role === 'operator'
        ? 'Operator'
        : 'Viewer';
  return (
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <Link to="/" className="workspace-brand">
          <ViewInArOutlined />
          Scenario Manager
        </Link>
        <div className="workspace-topbar-actions">
          <Link to="/editor" className="workspace-current">
            <span className="workspace-current__label">Current scenario</span>
            <strong>{name || 'Untitled scenario'}</strong>
            <span className="workspace-current__action">
              Open editor <ArrowOutward fontSize="inherit" />
            </span>
          </Link>
          {user.authentication_enabled ? (
            <button
              type="button"
              className="workspace-account"
              onClick={() => void logout()}
            >
              <span className="workspace-account__identity">
                <strong>{user.login}</strong>
                <small>{roleLabel}</small>
              </span>
              <span className="workspace-account__signout">
                Sign out <LogoutOutlined fontSize="inherit" />
              </span>
            </button>
          ) : (
            <span className="workspace-account workspace-account--development">
              <span className="workspace-account__identity">
                <strong>Development access</strong>
                <small>Authentication is disabled</small>
              </span>
            </span>
          )}
        </div>
      </header>
      <aside className="workspace-sidebar">
        <nav aria-label="Main navigation">
          <div className="workspace-nav-group workspace-nav-group--overview">
            <NavLink to="/" end>
              <DashboardOutlined />
              Dashboard
            </NavLink>
          </div>
          <div className="workspace-nav-group">
            <p className="workspace-nav-group__title">Scenarios</p>
            <NavLink to="/scenarios">
              <FolderOutlined />
              Scenarios
            </NavLink>
          </div>
          <div className="workspace-nav-group">
            <p className="workspace-nav-group__title">Simulation</p>
            <NavLink to="/experiments">
              <ScienceOutlined />
              Experiments
            </NavLink>
            <NavLink to="/runs">
              <PlayCircleOutlined />
              Runs
            </NavLink>
            <NavLink to="/replay">
              <HistoryOutlined />
              Replay
            </NavLink>
          </div>
          <div className="workspace-nav-group">
            <p className="workspace-nav-group__title">Account &amp; access</p>
            {user.role === 'admin' && (
              <NavLink to="/users">
                <PeopleOutlined />
                Users
              </NavLink>
            )}
            <NavLink to="/settings">
              <SettingsOutlined />
              Settings
            </NavLink>
          </div>
        </nav>
        <div className="workspace-sidebar-footer">
          <span>RESEARCH WORKSPACE</span>
          <strong>Urban V2X resilience</strong>
          <small>Scenario · Run · Evidence</small>
        </div>
      </aside>
      <div className="workspace-content">
        <Outlet />
      </div>
    </div>
  );
}
