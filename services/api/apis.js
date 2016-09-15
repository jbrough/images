'use strict';

const redis = require('redis');
const request = require('request');

module.exports = () => {
  return {
    redis: redis.createClient({ host: process.env.REDIS_HOST }),
    request,
  };
};
