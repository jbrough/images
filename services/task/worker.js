const async = require('async');

module.exports = (redispub, redissub, task, n) => {
  const CHANNEL = 'tasks';

  let halted = false;

  function halt() {
    halted = true;
    console.info('Task processing halted; waiting for events.');
  }

  function resume() {
    halted = false;
    console.info('Task processing resumed.');
  }

  function start(cb) {
    redissub.on('message', (chan, msg) => {
      if (chan != CHANNEL) return;

      if (isHalted()) {
        resume();
        doTasks(cb);
      }
    });

    redissub.subscribe(CHANNEL);

    doTasks(cb);
  }

  function isHalted() {
    return halted === true;
  }

  function isWorking() {
    return halted === false;
  }

  function doTasks(cb) {
    async.whilst(
      () => isWorking(),
      (callback) => task.next((err, res) => {
        if (err) return callback(err);

        if (res.empty) {
          halt()
          task.retry()
        }

        const msg = JSON.stringify(res);
        console.info(`[worker ${n}] processed task: ${msg}`);
        redispub.publish('task-ok', msg, (err) => {
          if (err) {
            console.error(err);
          }

          callback(null, res);
        });
      }),
      (err) => {
        if (err) {
          console.error(err);
          return cb(err);
        }
    });
  }

  return {
    start
  };
};
