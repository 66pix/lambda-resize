'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var sinon = require('sinon');
var fs = require('fs');
var path = require('path');
var s3 = require('../s3.js'); // eslint-disable-line id-length
var Promise = require('bluebird');

lab.experiment('index', function() {

  function getConfig() {
    return config;
  }

  var imageResize;
  var event;
  var context;
  var config;
  lab.beforeEach(function(done) {
    sinon.stub(fs, 'readFile', function(filename, encoding, callback) {
      callback(null, JSON.stringify(getConfig()));
    });

    imageResize = require('../index.js');

    context = {
      fail: function() {},
      succeed: function() {}
    };

    event = {
      Records: [
        {
          s3: {
            object: {
              key: '',
              size: 1024
            },
            bucket: {
              name: ''
            }
          }
        }
      ]
    };

    config = {
      destinationBucket: 'destination-bucket',
      sizes: [
        88,
        100,
        1024,
        2048
      ]
    };

    done();
  });

  lab.afterEach(function(done) {
    fs.readFile.restore();
    done();
  });

  lab.it('should fail if the image has a 0 size', function(done) {
    sinon.spy(context, 'fail');
    event.Records[0].s3.object.size = 0;

    imageResize.handler(event, context);

    expect(context.fail.calledOnce).to.equal(true);
    expect(context.fail.calledWith('Object size is 0')).to.equal(true);
    context.fail.restore();
    done();
  });

  lab.it('should fail if called with a source image that is at the bucket root', function(done) {
    sinon.spy(context, 'fail');
    event.Records[0].s3.object.key = 'root.js';

    imageResize.handler(event, context);

    expect(context.fail.calledOnce).to.equal(true);
    expect(context.fail.calledWith('Resize images function will not run for files at the bucket root')).to.equal(true);
    context.fail.restore();
    done();
  });

  lab.it('should fail if the config.json is missing', function(done) {
    fs.readFile.restore();

    sinon.stub(fs, 'readFile', function(filename, encoding, callback) {
      var error = new Error('ENOENT: no such file or directory, open \'./config.json\'');
      error.code = 'ENOENT';
      error.path = './config.json';
      callback(error);
    });

    sinon.spy(context, 'fail');
    event.Records[0].s3.bucket.name = 'source-bucket';
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledWith('Error ENOENT: ./config.json not found'));
      context.fail.restore();
      done();
    });
  });

  lab.it('should fail if there is no destination bucket', function(done) {
    config.destinationBucket = false;
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    sinon.spy(context, 'fail');
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledWith('Config must provide a destinationBucket')).to.equal(true);
      context.fail.restore();
      done();
    });
  });

  lab.it('should fail if there is no sizes array', function(done) {
    config.sizes = false;
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    sinon.spy(context, 'fail');
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledWith('Config must contain an array of widths to resize images to')).to.equal(true);
      context.fail.restore();
      done();
    });
  });

  lab.it('should fail if the sizes array contains no integers', function(done) {
    config.sizes = ['this is not a number', 'nor is this'];
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    sinon.spy(context, 'fail');
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledWith('Config must contain an array of widths to resize images to')).to.equal(true);
      context.fail.restore();
      done();
    });
  });

  lab.it('should fail if the source and destination buckets are the same', function(done) {
    config.destinationBucket = 'same-name';
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'same-name';

    sinon.spy(context, 'fail');
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledWith('Source and destination buckets must be different')).to.equal(true);
      context.fail.restore();
      done();
    });
  });

  lab.test('should attempt to download the source image from S3', function(done) {
    config.destinationBucket = 'destination-bucket';
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    sinon.stub(s3, 'getObjectAsync', function(options) {
      expect(options.Bucket).to.equal(event.Records[0].s3.bucket.name);
      expect(options.Key).to.equal(event.Records[0].s3.object.key);
      s3.getObjectAsync.restore();
      done();
    });
    imageResize.handler(event, context);
  });

  lab.it('should fail if the s3 object does not have a specified type', function(done) {
    config.destinationBucket = 'destination-bucket';
    event.Records[0].s3.object.key = 'some/path/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    sinon.spy(context, 'fail');
    sinon.stub(s3, 'getObjectAsync', function() {
      return Promise.resolve({
        ContentType: 'not/correct'
      });
    });
    imageResize.handler(event, context)
    .finally(function() {
      expect(context.fail.calledOnce).to.equal(true);
      expect(context.fail.calledWith('Invalid content type: not/correct is not one of image/jpg, image/jpeg, image/gif, image/png')).to.equal(true);
      s3.getObjectAsync.restore();
      context.fail.restore();
      done();
    });
  });

  lab.it('should not fail if the s3 object does have a specified type', function(done) {
    config.destinationBucket = 'destination-bucket';
    event.Records[0].s3.object.key = 'some/path/not/fail/type/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    var originalImage = fs.readFileSync(path.join(__dirname, './fixtures/66pix.jpg')); // eslint-disable-line no-sync
    sinon.stub(s3, 'getObjectAsync', function() {
      return Promise.resolve({
        Body: originalImage,
        ContentType: 'image/png'
      });
    });
    sinon.stub(s3, 'putObjectAsync', function() {
      return Promise.resolve({});
    });

    imageResize.handler(event, context)
    .finally(function() {
      s3.getObjectAsync.restore();
      s3.putObjectAsync.restore();
      done();
    });
  });

  lab.it('should attempt to put all resized objects', function(done) {
    config.destinationBucket = 'destination-bucket';
    event.Records[0].s3.object.key = 'some/path/not/fail/type/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    var originalImage = fs.readFileSync(path.join(__dirname, './fixtures/66pix.jpg')); // eslint-disable-line no-sync
    sinon.stub(s3, 'getObjectAsync', function() {
      return Promise.resolve({
        Body: originalImage,
        ContentType: 'image/png'
      });
    });
    sinon.stub(s3, 'putObjectAsync', function() {
      return Promise.resolve({
        VersionId: 123
      });
    });
    sinon.spy(context, 'succeed');

    imageResize.handler(event, context)
    .finally(function() {
      s3.getObjectAsync.restore();
      s3.putObjectAsync.restore();
      expect(context.succeed.calledWith('8 images resized from some/path/not/fail/type/file.jpg and uploaded to ' + config.destinationBucket)).to.equal(true);
      done();
    });
  });

  lab.it('should prepend the prefix correctly if provided', function(done) {
    config.destinationBucket = 'destination-bucket';
    config.prependPrefix = 'resized';
    event.Records[0].s3.object.key = 'some/path/not/fail/type/file.jpg';
    event.Records[0].s3.bucket.name = 'source-bucket';

    var originalImage = fs.readFileSync(path.join(__dirname, './fixtures/66pix.jpg')); // eslint-disable-line no-sync
    sinon.stub(s3, 'getObjectAsync', function() {
      return Promise.resolve({
        Body: originalImage,
        ContentType: 'image/png'
      });
    });
    sinon.stub(s3, 'putObjectAsync', function(params) {
      expect(params.Key.indexOf('resized')).to.equal(0);
      return Promise.resolve({
        VersionId: 123
      });
    });
    sinon.spy(context, 'succeed');

    imageResize.handler(event, context)
    .finally(function() {
      s3.getObjectAsync.restore();
      s3.putObjectAsync.restore();
      expect(context.succeed.calledWith('8 images resized from some/path/not/fail/type/file.jpg and uploaded to ' + config.destinationBucket)).to.equal(true);
      done();
    });
  });
});
