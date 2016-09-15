'use strict';

module.exports = (request) => {
  function RequestError(code, msg) {
    this.code = code;
    this.message = msg;
  }
  RequestError.prototype = new Error();

  return (buf, width, height, cb) => {
    const opts = {
      url: `http://localhost:${process.env.SF_RESIZER_PORT}/${width},${height}`,
      body: buf,
      encoding: null,
    };

    function callback(err, res, body) {
      if (err) {
        return cb(err)
      } else if (res.statusCode != 200) {
        return cb(new RequestError(res.statusCode, res.body.toString()));
      }

      const dims = res.headers['x-original-size'];
      return cb(null, body, dims);
    }

    request.post(opts, callback);
  }
};
