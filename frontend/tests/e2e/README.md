# Browser tests

Run `yarn test:e2e` for headless Chromium or `yarn test:e2e:headed` to see the
browser. The existing Playwright configuration builds and previews the app.
Node.js, Yarn, the project dependencies and Playwright Chromium must already
be installed.

`fixtures.ts` gives each test Playwright's isolated browser context and mocks
the scenario API and simulation WebSocket. It does not clear localStorage on
navigation, so the theme persistence tests exercise real persistence. API
requests not covered by the fixtures fail instead of reaching a live backend.
Map and model assets and the Three.js scene are loaded normally.

`theme.spec.ts` checks resolved CSS colors and the Light / Dark / System
preferences. It attaches screenshots of DOM components at desktop and small
laptop sizes to the HTML report. These are review artifacts, not unreviewed
golden-image assertions; WebGL canvas pixels are not part of the screenshots.
