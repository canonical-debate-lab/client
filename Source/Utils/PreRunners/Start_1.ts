import React from 'react';
// import JQuery from "../JQuery/JQuery3.1.0";

// include JQuery file directly from html, for faster building
const JQuery = jQuery;

G({ JQuery, jQuery: JQuery, $: JQuery }); declare global { const JQuery; /* const jQuery; const $; */ }
G({ React }); declare global { const React: typeof React; }
