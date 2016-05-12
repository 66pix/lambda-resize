'use strict';

/* eslint-disable no-console */

var filename = require('filename.js');
var Promise = require('bluebird');

module.exports = function imageProcessor(image) {
  return function processImageToWidth(width, retina) {
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

        var imageFilename = image.key;
        if (retina) {
          imageFilename = filename.appendSuffix('w' + parseInt(width / 2, 10), imageFilename);
          imageFilename = filename.appendSuffixWithDelimiter(retina, '', imageFilename);
        } else {
          imageFilename = filename.appendSuffix('w' + width, imageFilename);
        }

        return resolve({
          key: imageFilename,
          data: new Buffer(stdout, 'binary'),
          type: image.type
        });
      });
    });
  };
};
