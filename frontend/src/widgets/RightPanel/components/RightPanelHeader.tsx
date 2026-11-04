import type { EditorTab } from '@widgets/EditorNavigation/types/EditorNavigationTypes';

type RightPanelHeaderProps = {
  activeTab: EditorTab;
  scenarioName: string;
  panelMode: 'properties' | 'context';
  onPanelModeChange: (mode: 'properties' | 'context') => void;
};

export const RightPanelHeader = ({
  activeTab,
  scenarioName,
  panelMode,
  onPanelModeChange,
}: RightPanelHeaderProps) => (
  <div className="rp-header">
    <div className="rp-header-row">
      <span className="rp-title">
        {activeTab === 'edit'
          ? 'Inspector'
          : activeTab === 'simulation'
            ? 'Simulation'
            : 'Results'}
      </span>
      <span className="rp-badge">V2X</span>
    </div>
    <div className="rp-subtitle">{scenarioName || 'Untitled scenario'}</div>
    {activeTab === 'edit' && (
      <div
        className="rp-panel-switcher"
        role="group"
        aria-label="Inspector view"
      >
        <button
          type="button"
          aria-pressed={panelMode === 'properties'}
          onClick={() => onPanelModeChange('properties')}
        >
          Properties
        </button>
        <button
          type="button"
          aria-pressed={panelMode === 'context'}
          onClick={() => onPanelModeChange('context')}
        >
          Context
        </button>
      </div>
    )}
  </div>
);
