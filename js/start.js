if (window.require) const moment = window.require('moment');
// little workaround for Require.JS
// otherwize it doesn't load
window.requireNode = window.require;
window.require = undefined;
