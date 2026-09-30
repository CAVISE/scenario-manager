export interface ScenarioPreflightIssue {
  code: string;
  message: string;
  path: Array<string | number>;
  severity: 'error' | 'warning';
  entity_id: string | null;
}

export interface ScenarioPreflightResult {
  valid: boolean;
  issues: ScenarioPreflightIssue[];
}
