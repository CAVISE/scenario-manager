export const LOADING_STEPS = {
  init: { text: 'Initializing editor…', pct: 5 },
  wasm: { text: 'Loading WebAssembly…', pct: 25 },
  map: { text: 'Parsing road network…', pct: 50 },
  scene: { text: 'Building scene…', pct: 75 },
  done: { text: null, pct: 100 },
} as const;
