'use strict';

var AWS = require('aws-sdk');
var Promise = require('bluebird');
module.exports = Promise.promisifyAll(new AWS.S3());

