'use strict';

/* istanbul ignore next */
(function() {
  if (!process.env.SENTRY_DSN) {
    return;
  }
  var raven = require('raven');
  var client = new raven.Client(process.env.SENTRY_DSN);
  client.patchGlobal();
})();

