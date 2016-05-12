'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var fs = require('fs');
var path = require('path');
var imagemagick = require('imagemagick');
var sinon = require('sinon');

lab.experiment('process image', function() {

  var originalJpgImage;
  var originalPngImage;
  var imageProcessor;
  lab.before(function(done) {
    imageProcessor = require('../../functions/image-processor.js');
    originalJpgImage = fs.readFileSync(path.join(__dirname, '../fixtures/66pix.jpg'), 'binary'); // eslint-disable-line no-sync
    originalPngImage = fs.readFileSync(path.join(__dirname, '../fixtures/66pix.png'), 'binary'); // eslint-disable-line no-sync
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
      imagemagick.identify(['-format', '%w', destinationPath], function(error, out) {
        if (error) {
          return done(error);
        }
        expect(parseInt(out, 10)).to.equal(88);
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
      imagemagick.identify(['-format', '%w', destinationPath], function(error, out) {
        if (error) {
          return done(error);
        }
        expect(parseInt(out, 10)).to.equal(88);
        fs.unlinkSync(destinationPath); // eslint-disable-line no-sync
        return done();
      });
    });
  });

  lab.test('should reject with the error', function(done) {
    sinon.stub(imagemagick, 'resize', function(params, callback) {
      callback('this is err');
    });
    imageProcessor({
      data: originalJpgImage,
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(88)
    .catch(function(error) {
      imagemagick.resize.restore();
      expect(error).to.equal('imagemagick error: this is err');
      done();
    });
  });

  lab.test('should reject with the stderr', function(done) {
    sinon.stub(imagemagick, 'resize', function(params, callback) {
      callback(null, null, 'this is stderr');
    });
    imageProcessor({
      data: originalJpgImage,
      type: 'image/jpg',
      key: '/this/is/the/file.jpg'
    })(88)
    .catch(function(error) {
      imagemagick.resize.restore();
      expect(error).to.equal('imagemagick error: this is stderr');
      done();
    });
  });
});
