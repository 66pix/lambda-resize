'use strict';

/* eslint-disable no-console */

var filename = require('filename.js');
var Promise = require('bluebird');

module.exports = function imageProcessor(image) {
  return function processImageToWidth(width, suffix) {
    console.log(width, suffix);
    var params = {
      srcPath: '-',
      srcData: image.data,
      srcFormat: image.type,
      width: width,
      dstPath: '-',
      format: image.type
    };

    var imagemagick = require('imagemagick');
    return new Promise(function(resolve, reject) {
      imagemagick.resize(params, function(error, stdout, stderr) {
        if (error || stderr) {
          return reject('imagemagick error: ' + (error || stderr));
        }
        var suffixes = ['w' + width];
        if (suffix) {
          suffixes.push(suffix);
        }
        console.log('stdout is buffer?', Buffer.isBuffer(stdout));
        resolve({
          key: filename.appendSuffix(suffixes, image.key),
          data: new Buffer(stdout, 'binary'),
          type: image.type
        });
      });
    });
  };
};
