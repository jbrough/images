module.exports = (queue, api) => {
  function next(cb) {
    queue.next((err, task) => {
      if (err) return cb(err);

      if (task.empty) {
        return cb(null, task);
      } else {
        doTask(task.item, cb);
      }
    });
  }

  function retry() {
    queue.retry();
  }

  function doTask(task, cb) {
    api.storeVersion(task.id, task.version, (err, location) => {
      if (err) {
        console.error(err);
        queue.addError(task, (err2) => console.error(err2));
      }

      const ret = Object.assign({}, task, { empty: false });
      return cb(null, ret);
    });
  }

  return {
    next,
    retry,
  };
};
