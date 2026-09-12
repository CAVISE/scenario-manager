import { Tabs, Tab } from '@mui/material';
import { NavLink } from 'react-router-dom';
import type { EditorTab } from '../types/EditorNavigationTypes';
import '../styles/EditorNavigationStyles.scss';
import {
  HomeOutlined,
  FolderOutlined,
  SettingsOutlined,
  ViewInArOutlined,
  PlayArrowRounded,
  AssessmentOutlined,
} from '@mui/icons-material';
const tabs: Array<{
  id: EditorTab;
  label: string;
  hint: string;
  icon: React.ReactElement;
}> = [
  {
    id: 'edit',
    label: 'Edit',
    hint: 'Scene and properties',
    icon: <ViewInArOutlined />,
  },
  {
    id: 'simulation',
    label: 'Simulation',
    hint: 'Run and monitor',
    icon: <PlayArrowRounded />,
  },
  {
    id: 'results',
    label: 'Results',
    hint: 'Completed runs',
    icon: <AssessmentOutlined />,
  },
];

type EditorNavigationProps = {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
};

export function EditorNavigation({
  activeTab,
  onTabChange,
}: EditorNavigationProps) {
  return (
    <aside className="editor-navigation" aria-label="Editor workspace">
      <div className="editor-navigation-inner">
        <div className="editor-navigation-brand">
          <span className="editor-navigation-mark" aria-hidden="true">
            SM
          </span>
          <span className="editor-navigation-brand-name">
            Scenario
            <br />
            Manager
          </span>
        </div>
        <Tabs
          className="editor-navigation-tabs"
          aria-label="Workspace views"
          orientation="vertical"
          value={activeTab}
          onChange={(_, value: EditorTab) => onTabChange(value)}
          selectionFollowsFocus
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              id={`editor-tab-${tab.id}`}
              className="editor-navigation-tab"
              value={tab.id}
              label={tab.label}
              icon={tab.icon}
              aria-controls="editor-workspace-panel"
              title={tab.hint}
            />
          ))}
        </Tabs>
        <div className="editor-navigation-footer">
          <NavLink
            to="/"
            aria-label="Home"
            end
            className={({ isActive }) =>
              `editor-navigation-footer-link${isActive ? ' active' : ''}`
            }
          >
            <span className="editor-navigation-footer-icon" aria-hidden="true">
              <HomeOutlined fontSize="inherit" />
            </span>
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/scenarios"
            aria-label="Scenarios"
            className={({ isActive }) =>
              `editor-navigation-footer-link${isActive ? ' active' : ''}`
            }
          >
            <span className="editor-navigation-footer-icon" aria-hidden="true">
              <FolderOutlined fontSize="inherit" />
            </span>
            <span>Scenarios</span>
          </NavLink>
          <NavLink
            to="/settings"
            aria-label="Settings"
            className={({ isActive }) =>
              `editor-navigation-footer-link${isActive ? ' active' : ''}`
            }
          >
            <span className="editor-navigation-footer-icon" aria-hidden="true">
              <SettingsOutlined fontSize="inherit" />
            </span>
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
