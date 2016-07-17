'use strict';

/* eslint-disable no-console */

var filename = require('filename.js');
var Promise = require('bluebird');
var sharp = require('sharp');

module.exports = function imageProcessor(image) {
  return function processImageToWidth(width, retina) {
    return new Promise(function(resolve, reject) {
      var imageFilename = image.key;
      if (retina) {
        imageFilename = filename.appendSuffix('w' + parseInt(width / 2, 10), imageFilename);
        imageFilename = filename.appendSuffixWithDelimiter(retina, '', imageFilename);
      } else {
        imageFilename = filename.appendSuffix('w' + width, imageFilename);
      }

      sharp(image.data)
      .resize(width)
      .toBuffer()
      .then(function(data) {
        return resolve({
          key: imageFilename,
          data: data,
          type: image.type
        });
      })
      .catch(reject);
    });
  };
};
