const fs = require('fs');
const express = require('express');
const favicon = require('serve-favicon');
const reqId = require('express-request-id')();
const morgan = require('morgan');

module.exports = (apis, versions) => {
  const venues = require('./venues')(apis);
  const images = require('./images')(apis, versions);
  const queue = require('./queue')(apis.request);
  const routes = require('./routes')(venues, images, queue);
  const app = express();

  app.use(reqId);

  app.use(morgan('dev'));
  app.use(express.static('./dist'));

  app.use(favicon(`${__dirname}/static/favicon.ico`));

  app.get('/version', (req, res) => {
    res.json({ version: process.env.SF_VERSION });
  });

  app.get('/api/venues', routes.venues);
  app.get('/api/venue/:id', routes.venue);
  app.get('/api/album/:id', routes.album);
  app.delete('/api/album/:id', routes.deleteAlbum);
  app.post('/api/album/:id/image/add', routes.addImage);
  app.delete('/api/album/:id/image/:img', routes.deleteImage);
  app.post('/api/album/:id/image/:img/move/:index', routes.moveImage);
  app.post('/api/album/:id/versions/:version', routes.storeVersions(versions));
  app.post('/api/album/:id/reprocess', routes.queueStoreAllVersions(versions));
  app.post('/api/album/:id/reprocess/:version', routes.queueStoreVersions(versions));

  // these are convenience routes for debugging and are not used during queue processing.
  app.get('/api/queue/stats', routes.getQueueStats);
  app.get('/api/queue/tasks', routes.getQueueTasks);
  app.get('/api/queue/errors', routes.getQueueErrors);
  fs.readFile(`${__dirname}/static/index.html`, 'utf8', (err, str) => {
    if (err) throw(err);

    let bundle;

    const bucket = process.env.SF_GCS_BUCKET;
    const version = process.env.SF_VERSION;

    if (process.env.NODE_ENV === 'development') {
       bundle = 'http://localhost:8080/bundle.js';
    } else {
      bundle = `https://storage.googleapis.com/${bucket}/dist/${version}.js`;
    }

    const html = str.replace(/\{bundle\}/, bundle);

    app.get('/', (req, res) => {
     res.setHeader('content-type', 'text/html');
      res.send(html);
    });
  })

  return app;
};
