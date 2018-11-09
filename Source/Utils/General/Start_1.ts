// Note: This file is where the very first custom Javascript code runs. (it's the first file imported from Main.ts, and imports run before the file itself)

import React from 'react';

declare global { const React; }
window['React'] = React;

// needed for webpack-runtime-require runtime-imports
declare const __webpack_require__;
window['webpackData'] = __webpack_require__;