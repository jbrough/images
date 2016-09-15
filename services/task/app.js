async = require('async');

module.exports = (apis) => {
  const queue = require('./queue')(apis.request);
  const api = require('./api')(apis.request);

  const task = require('./task')(queue, api);
  const worker = require('./worker');

  async.parallel([
    (cb) => worker(apis.redispub, apis.redissub, task, 1).start(cb),
    (cb) => worker(apis.redispub, apis.redissub, task, 2).start(cb)
  ], (err) => {
    if (err) throw err;
  });
};
