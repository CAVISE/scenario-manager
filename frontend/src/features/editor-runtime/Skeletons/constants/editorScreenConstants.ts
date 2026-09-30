export const failedSubsystems = [
  { label: 'OpenDRIVE Runtime', failed: true },
  { label: 'WebAssembly Module', failed: true },
  { label: 'WebGL Renderer', failed: false },
];

export const loadingSubsystems = [
  { label: 'OpenDRIVE Runtime', threshold: 10 },
  { label: 'WebAssembly Module', threshold: 30 },
  { label: 'WebGL Renderer', threshold: 60 },
];

export const notFoundLogLines: {
  prefix: string;
  text: string;
  kind: 'error' | 'warn' | 'ok' | '';
  delay: number;
}[] = [
  {
    prefix: '[SYS:ROUTER]',
    text: 'Resolving route path…',
    kind: '',
    delay: 100,
  },
  {
    prefix: '[SYS:ROUTER]',
    text: 'ERROR — no handler registered',
    kind: 'error',
    delay: 350,
  },
  {
    prefix: '[SYS:CACHE]',
    text: 'Cache miss on requested URI',
    kind: 'warn',
    delay: 600,
  },
  {
    prefix: '[SYS:KERNEL]',
    text: 'Dispatching signal SIGNOTFOUND',
    kind: '',
    delay: 850,
  },
  {
    prefix: '[SYS:RENDER]',
    text: '404 handler mounted successfully',
    kind: 'ok',
    delay: 1100,
  },
];
