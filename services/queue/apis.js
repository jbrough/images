const redis = require('redis');

module.exports = () => {
  return {
    redis: redis.createClient({ host: process.env.REDIS_HOST }),
  };
};
