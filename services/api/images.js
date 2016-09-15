'use strict';

const async = require('async');

module.exports = (apis, versions) => {
  const images = require('./lib')(apis, versions).images;

  return {
    all: (id, cb) => {
      images.get(id, cb);
    },

    status: (id, cb) => {
      images.status(id, cb);
    },

    update: (albumId, id, index, cb) => {
      images.update(albumId, id, index, cb);
    },

    storeVersions: (albumId, version, cb) => {
      images.storeVersions(albumId, version, cb);
    },

    add: (albumId, upload, cb) => {
      images.ids(albumId, (err, ids) => {
        if (err) return cb(err);
        async.series([
          (callback) => images.store(upload.id, upload.buf).storeOriginal(callback),
          (callback) => images.store(upload.id, upload.buf).storeVersions(callback),
          (callback) => images.alter(albumId, ids, callback).add(upload.id),
        ], (err, res) => {
          if (err) return cb(err);

          return cb(null, res[2]);
        });
      });
    },

    del: (albumId, id, cb) => {
      async.waterfall([
        (callback) => images.ids(albumId, callback),
        (ids, callback) => images.alter(albumId, ids, callback).del(id),
      ], cb);
    },

    flush: (albumId, cb) => {
      images.alter(albumId, [], cb).flush();
    },

    mv: (albumId, id, index, cb) => {
      async.waterfall([
        (callback) => images.ids(albumId, callback),
        (ids, callback) => images.alter(albumId, ids, callback).mv(id, index),
      ], cb);
    },
  };
};
