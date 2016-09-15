'use strict';

module.exports = (request) => {
  function RequestError(code, msg) {
    this.code = code;
    this.message = msg;
  }
  RequestError.prototype = new Error();

  const host =`localhost:${process.env.SF_QUEUE_PORT}`;

  return {
    next: (cb) => {
      const opts = {
        url: `http://${host}/next`,
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

      request.post(opts, callback);
    },

    addError: (task, cb) => {
      const opts = {
        url: `http://${host}/add/error`,
        body: JSON.stringify(task),
      };

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

    retry: () => {
      const opts = {
        url: `http://${host}/retry`,
      };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
        } else if (res.statusCode != 200) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }
      }

      request.post(opts, callback);
    },

  };
};
