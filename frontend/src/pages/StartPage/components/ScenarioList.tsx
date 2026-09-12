import { getApiErrorMessageSync } from '@/api/errors';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';

interface ScenarioListProps {
  scenarios: ScenarioListItem[];
  onOpen: (item: ScenarioListItem) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  onOpen,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return <div className="sm-home-scenario-loading">Loading…</div>;
  }

  if (error) {
    return (
      <div className="sm-home-notice">
        {getApiErrorMessageSync(error, 'Failed to load scenarios.')}
      </div>
    );
  }

  if (scenarios.length === 0) {
    return <div className="sm-home-empty">No scenarios yet</div>;
  }

  return (
    <div className="sm-home-scenario-list">
      {scenarios.map((item) => (
        <div
          className="sm-home-scenario-item"
          key={item.scenario_id}
          onClick={() => onOpen(item)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && onOpen(item)}
        >
          <span className="sm-home-scenario-name">{item.name}</span>
          <span className="sm-home-scenario-arrow">&rarr;</span>
        </div>
      ))}
    </div>
  );
};
