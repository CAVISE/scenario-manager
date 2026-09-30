import { FolderOpenOutlined } from '@mui/icons-material';
import { getApiErrorMessageSync } from '@/api/errors';
import type { ScenarioCardsProps } from './types/WorkspaceTypes';

export function ScenarioCards({
  items,
  onOpen,
  onCreate,
  isLoading,
  error,
  currentId,
  onRetry,
}: ScenarioCardsProps) {
  if (isLoading)
    return (
      <div className="workspace-empty workspace-empty--loading" role="status">
        <span className="workspace-empty__icon" aria-hidden="true">
          <FolderOpenOutlined />
        </span>
        <strong>Loading scenarios</strong>
        <p>Preparing your scenario library…</p>
      </div>
    );
  if (error)
    return (
      <div className="workspace-empty" role="alert">
        <span className="workspace-empty__icon" aria-hidden="true">
          <FolderOpenOutlined />
        </span>
        <strong>Could not load scenarios</strong>
        <p>
          {getApiErrorMessageSync(
            error,
            'The scenario service is unavailable.'
          )}
        </p>
        <button type="button" className="workspace-secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  if (!items.length)
    return (
      <div className="workspace-empty">
        <span className="workspace-empty__icon" aria-hidden="true">
          <FolderOpenOutlined />
        </span>
        <strong>Your scenario library is empty</strong>
        <p>Create a scenario to add vehicles, roadside units and routes.</p>
        {onCreate && (
          <button
            type="button"
            className="workspace-primary"
            onClick={onCreate}
          >
            Create scenario
          </button>
        )}
      </div>
    );
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
