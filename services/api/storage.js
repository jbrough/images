'use strict';

module.exports = (request) => {
  function RequestError(code, msg) {
    this.code = code;
    this.message = msg;
  }
  RequestError.prototype = new Error();

  const host =`localhost:${process.env.SF_STORAGE_PORT}`;

  return {
    metadata: (name, cb) => {
      const opts = {
        url: `http://${host}/${name};metadata`,
        json: true,
      };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
          return cb(err);
        } else if (res.statusCode != 200) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        return cb(null, body);
      }

      request.get(opts, callback);
    },

    manifest: (name, cb) => {
      const opts = {
        url: `http://${host}/${name}`,
        json: true,
      };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
          return cb(err);
        } else if (res.statusCode != 200) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        return cb(null, body);
      }

      request.get(opts, callback);
    },

    download: (name, cb) => {
      const opts = {
        url: `http://${host}/${name}`,
        encoding: null,
      };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
          return cb(err);
        } else if (res.statusCode != 200) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        return cb(null, body);
      }

      request.get(opts, callback);
    },

    store: (name, buf, headers, cb) => {
      const opts = {
        url: `http://${host}/${name}`,
        body: buf,
        headers,
      };

      function callback(err, res, body) {
        if (err) {
          return cb(err)
        } else if (res.statusCode != 201) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        const ret = res.headers['location'];
        return cb(null, ret);
      }

      request.post(opts, callback);
    },
  };
};
