import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  HomeOutlined,
  FolderOutlined,
  SettingsOutlined,
  ViewInArOutlined,
} from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import './Workspace.scss';

export default function WorkspaceLayout() {
  useSimulationSocket();
  const name = useEditorStore((state) => state.Scenario.name);
  return (
    <div className="workspace-shell">
      <header className="workspace-topbar">
        <Link to="/" className="workspace-brand">
          <ViewInArOutlined />
          Scenario Manager
        </Link>
        <Link to="/editor" className="workspace-current">
          {name || 'Untitled scenario'} <span>Open editor →</span>
        </Link>
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
        </nav>
        <span className="workspace-sidebar-footer">V2X scenario workspace</span>
      </aside>
      <div className="workspace-content">
        <Outlet />
      </div>
    </div>
  );
}
