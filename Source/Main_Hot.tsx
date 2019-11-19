// import React from "react/lib/ReactWithAddons";
import { JustBeforeInitLibs_listeners, JustBeforeUI_listeners } from 'Main';
import ReactDOM from 'react-dom';
import { supportReactDevTools } from 'react-universal-hooks';

// supportReactDevTools({ active: DEV });
supportReactDevTools({ active: true });

// uncomment this if you want to load the source-maps and such ahead of time (making-so the first actual call can get it synchronously)
// StackTrace.get();

JustBeforeInitLibs_listeners.forEach((a) => a());
require('./InitLibs').InitLibs();

JustBeforeUI_listeners.forEach((a) => a());
const mountNode = document.getElementById('root');
const { RootUIWrapper } = require('./UI/Root');

ReactDOM.render(<RootUIWrapper/>, mountNode);
