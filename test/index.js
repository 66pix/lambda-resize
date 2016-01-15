'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();
var expect = Code.expect;
var sinon = require('sinon');
var fs = require('fs');
var s3 = require('../s3.js');

lab.experiment('lambda resize', function() {

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
              key: ''
            },
            bucket: {
              name: ''
            }
          }
        }
      ]
    };

    config = {
      destinationBucket: 'destination-bucket'
    };

    done();
  });

  lab.afterEach(function(done) {
    fs.readFile.restore();
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

  lab.it('should fail if called with something that is not png, jpg, jpeg or gif', function(done) {
    sinon.spy(context, 'fail');
    event.Records[0].s3.object.key = 'some/path/file.txt';

    imageResize.handler(event, context);

    expect(context.fail.calledOnce).to.equal(true);
    expect(context.fail.calledWith('txt is not one of jpg, jpeg, gif, png')).to.equal(true);
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
      expect(context.fail.calledWith('Destination bucket must be provided')).to.equal(true);
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

    sinon.stub(s3, 'getObjectAsync');
    imageResize.handler(event, context)
    .finally(function() {
      expect(s3.getObjectAsync.calledWith({
        Bucket: 'source-bucket',
        Key: 'some/path/file.jpg'
      })).to.equal(true);
      s3.getObjectAsync.restore();
      done();
    });
  });

});
