const express = require('express');
const morgan = require('morgan');

module.exports = (apis) => {
  const storage = require('./storage')(apis);
  const app = express();

  app.use(morgan('dev'));

  app.get('/:name;metadata', (req, res) => {
    storage(req.params.name).metadata((err, headers) => {
      if (err) {
        if (err.code != 404) {
          console.error(err)
          return res.status(500).send(err.message);
        } else {
          return res.status(404).end();
        }
      }

      res.set('Content-Type', 'application/json');
      return res.send(headers);
    })
  });

  app.get('/:name', (req, res) => {
    storage(req.params.name).metadata((err, headers) => {
      if (err) {
        if (err.code != 404) {
          console.error(err);
          return res.status(500).send(err.message);
        } else {
          return res.status(404).end();
        }
      }

      storage(req.params.name).download((err, body) => {
        if (err) {
          console.error(err);
          return res.status(500).send(err.message);
        }

        res.set('content-type', headers.contentType);

        return res.send(body);
      });
    });
  });

  app.post('/:name', (req, res) => {
    const chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() {
      const data = Buffer.concat(chunks);
      storage(req.params.name).store(data, req.headers, (err, location) => {
        if (err) {
          console.error(err);
          return res.status(500).end();
        }
        res.setHeader('Location', location);
        return res.status(201).end();
      });
    });
  });

  return app;
};
