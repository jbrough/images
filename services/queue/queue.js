const async = require('async');

module.exports = (redis, maxRetries) => {
  const PENDING = 'tasks';
  const PRIORITY = 'tasks_priority';
  const ERRORS = 'tasks_err';
  const MAX_RETRIES = maxRetries;

  function addItem(queue, value, cb) {
    const chan = queue === ERRORS ? ERRORS : PENDING;
    async.series([
      (callback) => redis.sadd(queue, value, callback),
      (callback) => redis.publish(chan, '', callback)
    ], cb);
  };

  function pop(name, cb) {
    redis.spop(name, (err, value) => {
      if (err) return cb(err);

      const item = JSON.parse(value);
      const ret = item ? { empty: false, item } : { empty: true };
      return cb(null, ret);
    });
  }

  function smembers(key, cb) {
    redis.smembers(key, (err, res) => {
      if (err) return cb(err);

      const ret = res.map((str) => JSON.parse(str));

      return cb(null, ret);
    })
  }

  function requeueError(res, cb) {
    const task = JSON.parse(res);
    task.retries ? task.retries += 1 : task.retries = 1;

    // gte in case MAX_RETRIES is reduced
    if (task.retries >= MAX_RETRIES) {
      return cb()
    }

    const newVal = JSON.stringify(task);

    redis.multi()
    .srem(ERRORS, res)
    .sadd(PENDING, newVal)
    .exec(cb);
  }

  return {
    stats: (cb) => {
      async.parallel({
        pending: (callback) => redis.scard(PENDING, callback),
        priority: (callback) => redis.scard(PRIORITY, callback),
        errors: (callback) => redis.scard(ERRORS, callback),
      }, cb)
    },

    errors: (cb) => {
      smembers(ERRORS, cb);
    },

    tasks: (cb) => {
      async.parallel({
        pending: (callback) => smembers(PENDING, callback),
        priority: (callback) => smembers(PRIORITY, callback),
      }, (err, res) => {
        if (err) return cb(err);

        cb(null, res);
      });
    },

    add: (item, cb) => {
      addItem(PENDING, item, cb)
    },

    addPriority: (item, cb) => {
      addItem(PRIORITY, item, cb)
    },

    addError: (item, cb) => {
      addItem(ERRORS, item, cb)
    },

    next: (cb) => {
      pop(PRIORITY, (err, res) => {
        if (err) return cb(err);

        if (res.empty === false) {
          return cb(null, res);
        } else {
          pop(PENDING, cb);
        }
      });
    },

    retry: (cb) => {
      redis.smembers(ERRORS, (err, res) => {
        if (err) return cb(err);

        async.each(res, requeueError, cb);
      });
    },

    flush: () => {
      redis.flushall();
    },
  };
};
