function request(responses) {
  function get(opts, cb) {
    const response = {
      headers: { 'content-type': 'application/json' },
      statusCode: responses.get[opts.url].statusCode || 200,
    }

    const data = responses.get[opts.url];

    response.body = data.json ? data.json : data;

    cb(null, response, response.body);
  }

  return {
    get
  };
}

module.exports = {
  request,
};
