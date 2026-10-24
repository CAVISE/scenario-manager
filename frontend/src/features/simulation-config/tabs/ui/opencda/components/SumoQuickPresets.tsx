import { Stack, Typography } from '@mui/material';

interface SumoQuickPresetsProps {
  onSelect: (host: string, port: number) => void;
}

const PRESETS = [
  { host: 'localhost', port: 8813 },
  { host: '127.0.0.1', port: 8813 },
  { host: 'localhost', port: 8814 },
];

export function SumoQuickPresets({ onSelect }: SumoQuickPresetsProps) {
  return (
    <Stack className="sim-config-quick-presets" direction="row" spacing={1}>
      <Typography variant="caption" color="text.secondary">
        Quick presets:
      </Typography>
      {PRESETS.map(({ host, port }) => (
        <Typography
          key={`${host}:${port}`}
          variant="caption"
          className="sim-config-preset"
          onClick={() => onSelect(host, port)}
        >
          {host}:{port}
        </Typography>
      ))}
    </Stack>
  );
}
