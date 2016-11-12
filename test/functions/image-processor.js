'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var fs = require('fs');
var path = require('path');
var sharp = require('sharp');

lab.experiment('process image', function() {

  var originalJpgImage;
  var originalPngImage;
  var imageProcessor;
  lab.before(function(done) {
    imageProcessor = require('../../functions/image-processor.js');
    originalJpgImage = fs.readFileSync(path.join(__dirname, '../fixtures/66pix.jpg')); // eslint-disable-line no-sync
    originalPngImage = fs.readFileSync(path.join(__dirname, '../fixtures/66pix.png')); // eslint-disable-line no-sync
    done();
  });

  lab.test('should resize the given jpg image into appropriately named files', function(done) {
    imageProcessor({
      data: originalPngImage,
      type: 'image/png',
      key: '/this/is/the/file.png'
    })(88)
    .then(function(resizedImage) {
      expect(resizedImage.key).to.equal('/this/is/the/file.w88.png');
      done();
    });
  });

  lab.test('should resize the original jpg image to the correct width', function(done) {
    imageProcessor({
      data: originalPngImage,
      type: 'image/png',
      key: '/this/is/the/file.png'
    })(88)
    .then(function(resizedImage) {
      var destinationPath = path.resolve(__dirname, '../fixtures/resized.png');
      fs.writeFileSync(destinationPath, resizedImage.data, 'binary'); // eslint-disable-line no-sync
      sharp(destinationPath)
      .metadata()
      .then(function(metadata) {
        expect(parseInt(metadata.width, 10)).to.equal(88);
        fs.unlinkSync(destinationPath); // eslint-disable-line no-sync
        return done();
      });
    });
  });

  lab.test('should resize the given jpg image into appropriately named files', function(done) {
    imageProcessor({
      data: originalJpgImage,
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(88)
    .then(function(resizedImage) {
      expect(resizedImage.key).to.equal('/this/is/the/file.w88.jpg');
      done();
    });
  });

  lab.test('should resize the given jpg image into appropriately named files with retina', function(done) {
    imageProcessor({
      data: originalJpgImage,
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(176, '@2x')
    .then(function(resizedImage) {
      expect(resizedImage.key).to.equal('/this/is/the/file.w88@2x.jpg');
      done();
    });
  });

  lab.test('should resize the original jpg image to the correct width', function(done) {
    imageProcessor({
      data: originalJpgImage,
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(88)
    .then(function(resizedImage) {
      var destinationPath = path.resolve(__dirname, '../fixtures/resized.jpg');
      fs.writeFileSync(destinationPath, resizedImage.data, 'binary'); // eslint-disable-line no-sync
      sharp(destinationPath)
      .metadata()
      .then(function(metadata) {
        expect(parseInt(metadata.width, 10)).to.equal(88);
        fs.unlinkSync(destinationPath); // eslint-disable-line no-sync
        return done();
      });
    });
  });

  lab.test('should reject with the error', function(done) {
    imageProcessor({
      data: new Buffer('not an image'),
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(88)
    .catch(function(error) {
      expect(error.message).to.equal('Input buffer contains unsupported image format');
      done();
    });
  });
});
