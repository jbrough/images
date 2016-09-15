'use strict';

const async = require('async');
const env = process.env.NODE_ENV;
const _ = require('lodash');

// TODO: I don't know why I did this. If it was a hashmap of :id => :index it would be so easy
// we'd just need to update the value to the new index.
function shiftedArray(array, currentIndex, targetIndex) {
  const arr = array.concat([]);

  if (currentIndex !== targetIndex && 0 <= currentIndex && arr.length > currentIndex && 0 <= targetIndex && arr.length > targetIndex) {
    const tmp = arr[currentIndex];
    if (currentIndex < targetIndex) {
      for (let i = currentIndex; i < targetIndex; i++) {
        arr[i] = arr[i + 1];
      }
    } else {
      for (let i = currentIndex; i > targetIndex; i--) {
        arr[i] = arr[i - 1];
      }
    }
    arr[targetIndex] = tmp;
  }

  return arr;
}

module.exports = (apis, versions) => {
  const resize = require('./resize')(apis.request);
  const storage = require('./storage')(apis.request);

  function downloadImage(id, cb) {
    storage.download(`${id}.jpg`, cb);
  }

  function getManifest(id, cb) {
    storage.manifest(`${id}.json`, (err, res) => {
      if (err && err.code != 404) return cb(err);

      if (err && err.code == 404) {
        return cb(null, { ids: [] });
      } else {
        return cb(null, res)
      }
    });
  }

  function getImageIds(albumId, cb) {
    getManifest(albumId, (err, manifest) => {
      if (err) return cb(err);

      return cb(null, manifest.ids);
    });
  }

  function getImages(albumId, cb) {
    getManifest(albumId, (err, manifest) => {
      async.map(manifest.ids, getImageMetadata, cb)
    });
  }

  function getImageMetadata(id, cb) {
    const name = `${id}.jpg`;
    storage.metadata(name, (err, res) => {
      if (err && err.code === 404) {
        const m = {
          name,
          _missing: true,
          metadata: {},
          bucket: process.env.SF_GCS_BUCKET,
        }

        return cb(null, m);
      } else {
        return cb(err, res);
      }
    });
  }

  function updateManifest(albumId, ids, cb) {
    getManifest(albumId, (err, manifest) => {
      if (err) return cb(err);

      manifest.ids = ids;

      const headers = {
        'content-type': 'application/json',
        'cache-control': 'no-cache',
      };
      const data = JSON.stringify(manifest);

      storage.store(`${albumId}.json`, data, headers, cb);
    });
  }

  function storeImages(id, buf) {
    function filename(version) {
      return version ? `${version}_${id}.jpg` : `${id}.jpg`;
    }

    function storeVersion(name, dims, headers, cb) {
      resize(buf, dims.x, dims.y, (err, buf, original_size) => {
        if (err) return cb(err);

        headers['pb-original-size'] = original_size;
        headers['content-type'] = 'image/jpeg';

        storage.store(name, buf, headers, cb);
      });
    }

    function storeOriginal(cb) {
      resize(buf, -1, -1, (err, _, original_size) => {
        if (err) return cb(err);

        const headers = {
          'cache-control': 'max-age=31536000',
          'pb-original-size': original_size,
          'content-type': 'image/jpeg',
        };

        storage.store(filename(), buf, headers, cb);
      });
    }

    function storeVersions(cb) {
      async.forEachOf(versions, (dims, version, callback) => {
        const name = filename(version);
        const headers = {
          'cache-control': 'max-age=31536000',
        };

        storeVersion(name, dims, headers, callback);
      }, cb);
    }

    return {
      storeOriginal,
      storeVersions,
      storeVersion,
    };
  }

  function storeVersions(albumId, version, cb) {
    getImageIds(albumId, (err, ids) => {
      if (err) return cb(err);

      async.eachSeries(ids, (id, callback) => {
        const idx = ids.indexOf(id);

        if (version === 'original') {
          getAndStoreOriginal(albumId, id, callback);
        } else {
          getAndStoreVersion(albumId, id, idx, version, callback);
        }
      }, cb)
    });
  }

  function getAndStoreOriginal(albumId, id, cb) {
    async.waterfall([
      (callback) => downloadImage(id, callback),
      (buf, callback) => {
        const store = storeImages(id, buf);
        store.storeOriginal(cb);
      }
    ], cb);
  }

  function getAndStoreVersion(albumId, id, idx, version, cb) {
    const name = `${version}_${id}.jpg`;
    const headers = {
      'cache-control': 'max-age=31536000',
    };

    const dims = versions[version];

    async.waterfall([
      (callback) => downloadImage(id, callback),
      (buf, callback) => {
        const store = storeImages(id, buf);
        store.storeVersion(name, dims, headers, (err, res) => {
          if (err) return cb(err);

          return callback();
        });
      }
    ], cb);
  }

  function alterImages(albumId, images, cb) {
    const previousState = images.concat([]);

    function imageIndex(id) {
      return images.findIndex((img) => img === id);
    }

    function save(ids) {
      updateManifest(albumId, ids, () => {
        const newState = ids;

        return cb(null, ids);
      });
    }

    return {
      mv: (id, toIndex) => save(shiftedArray(images, imageIndex(id), toIndex)),
      add: (id) => save(images.indexOf(id) > -1 ? images : images.concat([id])),
      del: (id) => save(images.filter((img) => img !== id)),
      flush: () => save([]),
    };
  }

  function updateImages(albumId, id, index, cb) {
    downloadImage(id, (err, buf) => {
      if (err) return cb(err, null);

      storeImages(id, buf).storeVersions(cb);
    });
  }

  return {
    images: {
      update: updateImages,
      get: getImages,
      ids: getImageIds,
      store: storeImages,
      alter: alterImages,
      storeVersions,
    }
  };
};
