const crypto = require('crypto');

module.exports = (buf) => {
  const md5sum = crypto.createHash('md5').update(buf);
  return { buf, id: md5sum.digest('hex') };
};
