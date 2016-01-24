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
    console.log('imagemagick');
    return new Promise(function(resolve, reject) {
      console.log('resize');
      console.log(params.srcPath, params.srcFormat, params.width, params.dstPath, params.format);
      imagemagick.resize(params, function(error, stdout, stderr) {
        console.log(error);
        console.log(stderr);
        if (error || stderr) {
          return reject('imagemagick error: ' + (error || stderr));
        }
        console.log('no errors');
        var suffixes = ['w' + width];
        if (suffix) {
          suffixes.push(suffix);
        }
        console.log(suffixes);
        resolve({
          key: filename.appendSuffix(suffixes, image.key),
          data: stdout,
          type: image.type
        });
      });
    });
  };
};
