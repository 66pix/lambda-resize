'use strict';

var Promise = require('bluebird');
var filename = require('filename.js');
var R = require('ramda');

var ALLOWED_FILETYPES = ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'];

module.exports.handler = function(event, context) {
  var s3Object = event.Records[0].s3;
  if (s3Object.object.size === 0) {
    return context.fail('Object size is 0');
  }

  if (!filename.directoryName(s3Object.object.key)) {
    return context.fail('Resize images function will not run for files at the bucket root');
  }

  var config;
  var s3 = require('./s3.js');
  var path = require('path');
  return Promise.promisify(require('fs').readFile)(path.resolve(__dirname, 'config.json'), 'utf8')
  .then(function(configString) {
    return JSON.parse(configString);
  })
  .then(function validateConfig(_config_) {
    config = _config_;
    if (!config.destinationBucket) {
      throw new Error('Config must provide a destinationBucket');
    }
    config.sizes = config.sizes || [];
    config.sizes = config.sizes.filter(function(size) {
      return !isNaN(parseInt(size, 10)) && isFinite(size);
    });
    if (!config.sizes.length) {
      throw new Error('Config must contain an array of widths to resize images to');
    }
    return config;
  })
  .then(function validateBucket() {
    if (s3Object.bucket.name === config.destinationBucket) {
      throw new Error('Source and destination buckets must be different');
    }

  })
  .then(function getObject() {
    return s3
    .getObjectAsync({
      Bucket: s3Object.bucket.name,
      Key: s3Object.object.key
    });
  })
  .then(function validateImageType(image) {
    if (ALLOWED_FILETYPES.indexOf(image.ContentType) === -1) {
      throw new Error('Invalid content type: ' + image.ContentType + ' is not one of ' + ALLOWED_FILETYPES.join(', '));
    }

    return image;
  })
  .then(function resizeImage(image) {
    var imageProcessor = require('./functions/image-processor.js')({
      data: image.Body,
      type: image.ContentType,
      key: s3Object.object.key
    });
    return Promise.all(R.flatten(config.sizes.map(function(size) {
      return [
        imageProcessor(size),
        imageProcessor(size * 2, '@2x')
      ];
    })));
  })
  .then(function putObjects(images) {
    return Promise.all(images.map(function(image) {
      var key = image.key;
      if (config.prependPrefix) {
        key = path.join(config.prependPrefix, image.key);
      }
      return s3.putObjectAsync({
        Bucket: config.destinationBucket,
        Key: key,
        Body: image.data,
        ContentType: image.type,
        ContentEncoding: 'utf8'
      });
    }));
  })
  .then(function(responses) {
    console.log(responses.length + ' images resized from ' + s3Object.object.key + ' and uploaded to ' + config.destinationBucket); // eslint-disable-line no-console
    context.succeed(responses.length + ' images resized from ' + s3Object.object.key + ' and uploaded to ' + config.destinationBucket);
  })
  .catch(function(error) {
    if (error.code === 'ENOENT') {
      return context.fail('Error ' + error.code + ': ' + error.path + ' not found');
    }
    return context.fail(error.message);
  });

};
