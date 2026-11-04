import type { ScenarioControlWidgetProps } from '../types/ScenarioControlWidgetTypes';

interface ScenarioPreflightProps {
  controls: ScenarioControlWidgetProps['controls'];
  disabled: boolean;
  onFocusIssue: (entityId: string | null) => void;
}

export function ScenarioPreflight({
  controls,
  disabled,
  onFocusIssue,
}: ScenarioPreflightProps) {
  const { preflight } = controls;
  return (
    <div className="rp-preflight" aria-live="polite">
      <div className="rp-preflight__header">
        <span>Preflight check</span>
        {preflight ? (
          <span
            className={`rp-preflight__status ${
              preflight.valid ? 'is-valid' : 'has-errors'
            }`}
          >
            {preflight.valid
              ? preflight.issues.length
                ? 'Ready with warnings'
                : 'Ready to run'
              : `${preflight.issues.length} issue${
                  preflight.issues.length === 1 ? '' : 's'
                }`}
          </span>
        ) : (
          <span className="rp-preflight__status">Not checked</span>
        )}
      </div>
      {preflight?.issues.length ? (
        <ul className="rp-preflight__issues">
          {preflight.issues.map((issue, index) => (
            <li
              key={`${issue.code}-${issue.path.join('.')}-${index}`}
              className={`is-${issue.severity}`}
            >
              <span>{issue.message}</span>
              {issue.entity_id ? (
                <button
                  type="button"
                  onClick={() => onFocusIssue(issue.entity_id)}
                >
                  Show on scene
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rp-preflight__hint">
          {preflight?.valid
            ? 'The scenario configuration is ready for a simulation run.'
            : 'Check the current configuration before starting a simulation.'}
        </p>
      )}
      <button
        type="button"
        className="rp-btn rp-preflight__button"
        disabled={disabled}
        onClick={controls.validate}
      >
        {controls.operation === 'validate' ? 'Checking…' : 'Check scenario'}
      </button>
    </div>
  );
}
