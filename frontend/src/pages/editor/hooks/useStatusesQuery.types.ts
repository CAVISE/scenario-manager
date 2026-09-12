export interface Status {
  scenario_id: string;
  scenario_name: string;
  status: string;
}

export const statusesKey = ['statuses'] as const;

export const IButtStyles = {
  position: 'fixed',
  bottom: 16,
  right: 16,
  zIndex: 9999,
} as const;
