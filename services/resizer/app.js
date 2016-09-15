const express = require('express');
const morgan = require('morgan');

module.exports = (apis) => {
  const resize = require('./resize')(apis);
  const app = express();

  app.use(morgan('dev'));

  app.post('/:w,:h', (req, res) => {
    const chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() {
      const data = Buffer.concat(chunks);

      let dims;
      if (req.params.w != "-1") {
        dims = {
          w: parseInt(req.params.w),
          h: parseInt(req.params.h),
        };
      } else {
        dims = null;
      }

      resize(data, dims, (err, buf, original_dims) => {
        if (err) {
          console.error(err);
          return res.status(500).end();
        }

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Original-Size', original_dims);
        res.send(buf);
      });
    });
  });

  return app;
};
