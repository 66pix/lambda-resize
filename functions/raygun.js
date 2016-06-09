'use strict';

/* istanbul ignore next */
(function() {
  if (!process.env.RAYGUN_API_KEY) {
    console.log('No RAYGUN_API_KEY found'); // eslint-disable-line no-console
    return;
  }

  var raygun = require('raygun');
  var path = require('path');

  var raygunClient = new raygun.Client().init({
    apiKey: process.env.RAYGUN_API_KEY,
    offlineStorageOptions: {
      cachePath: path.join(__dirname, 'raygunCache/'),
      cacheLimit: 0
    }
  });

  raygunClient.setTags([
    process.env.NODE_ENV
  ]);
})();

