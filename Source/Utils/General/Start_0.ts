// Note: This file is where the very first custom Javascript code runs. (it's the first file imported from Main.ts, and imports run before the file itself)

import './Start_0'; // fake/empty import, so this module is correctly seen as module (rather than raw js script)

// special, early, definitely-safe codes
var g = window as any;
// declare global { const g; } window['g'] = window;

// needed for webpack-runtime-require runtime-imports
declare var __webpack_require__;
g.webpackData = __webpack_require__;