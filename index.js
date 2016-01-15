'use strict';

var Promise = require('bluebird');
var filename = require('filename.js');

// var gm = require('gm')
// .subClass({
//   imageMagick: true
// });

var ALLOWED_FILETYPES = ['jpg', 'jpeg', 'gif', 'png'];

module.exports.handler = function(event, context) {
  var sourceKey = event.Records[0].s3.object.key;
  var destinationFolderName = filename.directoryName(sourceKey);
  if (!destinationFolderName) {
    return context.fail('Resize images function will not run for files at the bucket root');
  }

  var sourceExtension = filename.extension(sourceKey);
  if (ALLOWED_FILETYPES.indexOf(sourceExtension) === -1) {
    return context.fail(sourceExtension + ' is not one of ' + ALLOWED_FILETYPES.join(', '));
  }

  var config;
  var s3 = require('./s3.js');
  return Promise.promisify(require('fs').readFile)('./conig.json', 'utf8')
  .then(function(configString) {
    return JSON.parse(configString);
  })
  .then(function validateBucket(_config_) {
    config = _config_;
    if (!config.destinationBucket) {
      throw new Error('Destination bucket must be provided');
    }

    var sourceBucket = event.Records[0].s3.bucket.name;
    if (sourceBucket === config.destinationBucket) {
      throw new Error('Source and destination buckets must be different');
    }

    return s3.getObjectAsync({
      Bucket: sourceBucket,
      Key: sourceKey
    });
  })
  .catch(function(error) {
    if (error.code === 'ENOENT') {
      return context.fail('Error ' + error.code + ': ' + error.path + ' not found');
    }
    return context.fail(error.message);
  });

};
