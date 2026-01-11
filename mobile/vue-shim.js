const Vue = require('vue/dist/vue.runtime.common.js');

// Vue 2 is CommonJS; ensure a default export for TS-compiled imports.
if (!Vue.default) Vue.default = Vue;

module.exports = Vue;
