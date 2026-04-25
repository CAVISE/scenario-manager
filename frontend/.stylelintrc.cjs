module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-scss'],

  ignoreFiles: [
    '**/*.{js,ts,tsx,json}',
    '**/*.{png,jpg,jpeg,glb,wasm,xodr}',
    '**/node_modules/**',
    '**/dist/**',
    '**/public/**',
    '**/*.lock',
    '**/*.map',
  ],

  rules: {
    'no-empty-source': null,
  },
};
