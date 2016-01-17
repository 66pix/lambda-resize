'use strict';

var filename = require('filename.js');

module.exports = function imageProcessor(image) {
  return function processImageToWidth(width) {
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
        resolve({
          key: filename.appendSuffix('w' + width, image.key),
          data: stdout,
          type: image.type
        });
      });
    });
  };
};
