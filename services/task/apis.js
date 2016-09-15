'use strict';

const request = require('request');
const redis = require('redis');

module.exports = () => {
  return {
    redispub: redis.createClient({ host: process.env.REDIS_HOST }),
    redissub: redis.createClient({ host: process.env.REDIS_HOST }),
    request,
  };
};
