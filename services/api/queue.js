'use strict';

module.exports = (request) => {
  function RequestError(code, msg) {
    this.code = code;
    this.message = msg;
  }
  RequestError.prototype = new Error();

  const host =`localhost:${process.env.SF_QUEUE_PORT}`;

  function getJSON(path, cb) {
    const opts = {
      url: `http://${host}/${path}`,
    };

    function callback(err, res, body) {
      if (err) {
        console.error(err);
        return cb(err);
      } else if (res.statusCode != 200) {
        return cb(new RequestError(res.statusCode, res.body.toString()));
      }

      const ret = JSON.parse(body);
      return cb(null, ret);
    }

    request.get(opts, callback);
  };

  return {
    stats: (cb) => getJSON('stats', cb),

    errors: (cb) => getJSON('errors', cb),

    tasks: (cb) => getJSON('tasks', cb),

    add: (id, version, priority, cb) => {
      const opts = {
        url: `http://${host}/add`,
        body: JSON.stringify({ id, version }),
      };

      if (priority) opts.qs = { priority: 1 };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
          return cb(err);
        } else if (res.statusCode != 201) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        return cb(null);
      }

      request.post(opts, callback);
    },

  };
};
