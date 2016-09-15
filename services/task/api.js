'use strict';

module.exports = (request) => {
  function RequestError(code, msg) {
    this.code = code;
    this.message = msg;
  }
  RequestError.prototype = new Error();

  const host =`localhost:${process.env.SF_API_PORT}`;

  return {
    storeVersion: (id, version, cb) => {
      const opts = {
        url: `http://${host}/api/album/${id}/versions/${version}`,
      };

      function callback(err, res, body) {
        if (err) {
          console.error(err);
          return cb(err);
        } else if (res.statusCode != 200) {
          return cb(new RequestError(res.statusCode, res.body.toString()));
        }

        return cb(null);
      }

      request.post(opts, callback);
    },
  };
};
