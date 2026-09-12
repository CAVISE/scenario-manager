import type { ScenarioListItem } from '@/api/types/IScenarioTypes';
import { getApiErrorMessageSync } from '@/api/errors';

export function ScenarioCards({
  items,
  onOpen,
  isLoading,
  error,
  currentId,
  onRetry,
}: {
  items: ScenarioListItem[];
  onOpen: (item: ScenarioListItem) => void;
  isLoading: boolean;
  error?: Error | null;
  currentId?: string;
  onRetry: () => void;
}) {
  if (isLoading)
    return (
      <div className="workspace-empty" role="status">
        Loading scenarios…
      </div>
    );
  if (error)
    return (
      <div className="workspace-empty" role="alert">
        <strong>Could not load scenarios</strong>
        <p>
          {getApiErrorMessageSync(
            error,
            'The scenario service is unavailable.'
          )}
        </p>
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  if (!items.length)
    return <div className="workspace-empty">No scenarios to show.</div>;
  return (
    <ul className="workspace-scenario-list">
      {items.map((item) => {
        const preview =
          item.preview &&
          (/^(data:image\/|https?:\/\/|\/)/.test(item.preview)
            ? item.preview
            : `data:image/png;base64,${item.preview}`);
        return (
          <li key={item.scenario_id}>
            <button
              type="button"
              className="workspace-scenario-card"
              onClick={() => onOpen(item)}
            >
              {preview ? (
                <img src={preview} alt="" loading="lazy" />
              ) : (
                <span className="workspace-map-placeholder" aria-hidden="true">
                  ▦
                </span>
              )}
              <span className="workspace-scenario-copy">
                <strong>{item.name || 'Untitled scenario'}</strong>
                <small>{item.annotation || 'V2X scenario'}</small>
              </span>
              {currentId === item.scenario_id && (
                <span className="workspace-badge">Current</span>
              )}
              <span className="workspace-open-label">Open →</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
