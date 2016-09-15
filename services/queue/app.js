const express = require('express');
const morgan = require('morgan');

const apis = require('./apis')();

module.exports = (apis) => {
  const maxRetries = process.env.SF_QUEUE_MAX_RETRIES;
  const queue = require('./queue')(apis.redis, maxRetries);
  const app = express();

  app.use(morgan('dev'));

  app.get('/stats', (req, res) => {
    queue.stats((err, stats) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      res.set('Content-Type', 'application/json');
      return res.send(stats);
    })
  });

  app.get('/tasks', (req, res) => {
    queue.tasks((err, tasks) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      res.set('Content-Type', 'application/json');
      return res.send(tasks);
    })
  });

  app.get('/errors', (req, res) => {
    queue.errors((err, errors) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      res.set('Content-Type', 'application/json');
      return res.send(errors);
    })
  });

  app.post('/add', (req, res) => {
    const chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() {
      const data = Buffer.concat(chunks);
      const type = req.query.priority ? 'addPriority' : 'add';
      queue[type](data.toString(), (err) => {
        if (err) {
          return res.status(500).send(err.message);
        }

        return res.status(201).end();
      });
    });
  });

  app.post('/add/error', (req, res) => {
    const chunks = [];
    req.on('data', function(chunk) { chunks.push(chunk); });
    req.on('end', function() {
      const data = Buffer.concat(chunks);
      queue.addError(data.toString(), (err) => {
        if (err) {
          return res.status(500).send(err.message);
        }

        return res.status(201).end();
      });
    });
  });

  app.post('/next', (req, res) => {
    queue.next((err, item) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      res.set('Content-Type', 'application/json');
      return res.send(item);
    })
  });

  app.post('/retry', (req, res) => {
    queue.retry((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err.message);
      }

      return res.status(200).end();
    })
  });

  app.delete('/', (req, res) => {
    queue.flush();
    return res.status(200).end();
  });

  return app;
};
