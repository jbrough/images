const async = require('async');
const upload = require('./upload');
const _ = require('lodash');

function sendError(reqId, res, err) {
  console.error(err)
  res.status(500).send();
}

function handler(reqId, res) {
  return (err, response) => {
    if (err) return sendError(reqId, res, err);

    res.json(response);
  };
}

module.exports = function routes(venues, images, queue) {
  function metadata(reqId, res, albumId) {
    return (err, response) => {
      if (err) return sendError(reqId, res, err);

      images.all(albumId, (err, data) => {
        if (err) return sendError(reqId, res, err);

        res.json(data);
      });
    }
  }

  return {
    venues: (req, res) => {
      venues(handler(req.id, res));
    },

    venue: (req, res) => {
      venues((err, results) => {
        if (err) return sendError(req.id, res, err);

        const id = Number(req.params.id);
        const venues = results.active.concat(results.inactive);

        const venue = _.find(venues, (r) => r.id === id);

        if (venue) {
          return res.json(venue);
        } else {
          return res.status(404).end()
        }
      });
    },

    album: (req, res) => {
      const id = req.params.id;
      metadata(req.id, res, id)();
    },

    wellknowns: (req, res) => {
      const id = req.params.id;
      images.wellknowns(id, handler(req.id, res));
    },

    deleteAlbum: (req, res) => {
      const id = req.params.id;

      images.flush(id, metadata(req.id, res, id));
    },

    storeVersions: (versions) => {
      return (req, res) => {
        const id = req.params.id;
        const version = req.params.version;

        if (version != 'original' && versions[version] == undefined) {
          return res.status(500).end("Version invalid");
        }

        images.storeVersions(id, version, (err) => {
          if (err) return sendError(req.id, res, err);
          res.status(200).end();
        });
      };
    },

    queueStoreAllVersions: (versions) => {
      return (req, res) => {
        const id = req.params.id;
        const v = Object.keys(versions).concat(['original']);
        const priority = req.query.priority;

        async.map(
          v,
          (version, cb) => queue.add(id, version, priority, cb),
          (err) => {
            if (err) return sendError(req.id, res, err);

            res.status(200).end();
        });
      };
    },

    queueStoreVersions: (versions) => {
      return (req, res) => {
        const id = req.params.id;
        const version = req.params.version;
        const priority = req.query.priority;

        if (version != 'original' && versions[version] == undefined) {
          return res.status(404).end("Version invalid");
        }

        queue.add(id, version, priority, (err) => {
          if (err) return sendError(req.id, res, err);

          res.status(200).end();
        });
      };
    },

    addImage: (req, res) => {
      const chunks = [];
      req.on('data', function(chunk) { chunks.push(chunk); });
      req.on('end', function() {
        const buf = Buffer.concat(chunks);

        const id = req.params.id;

        images.add(id, upload(buf), metadata(req.id, res, id));
      });
    },

    deleteImage: (req, res) => {
      const id = req.params.id;
      const img = req.params.img;

      images.del(id, img, metadata(req.id, res, id));
    },

    moveImage: (req, res) => {
      const id = req.params.id;
      const img = req.params.img;
      const index = Number(req.params.index);

      images.mv(id, img, index, metadata(req.id, res, id));
    },

    cropImage: (req, res) => {
      const img = req.params.id;
      const params = req.body.data.split(',');

      images.crop(img, params, handler(req.id, res));
    },

    getQueueStats: (req, res) => {
      queue.stats(handler(req.id, res));
    },

    getQueueErrors: (req, res) => {
      queue.errors(handler(req.id, res));
    },

    getQueueTasks: (req, res) => {
      queue.tasks(handler(req.id, res));
    },

  };
};
