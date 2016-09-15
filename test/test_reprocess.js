const test = require('ava');
const request = require('request');
const async = require('async');
const redis = require('redis').createClient();

const h = require('./utils');

redis.flushall;

// this also tests [POST /api/album/:id/versions/version] as all versions are updated
// via that (synchronous) endpoint.
test.cb('api: reprocess all versions', (t) => {
  const name = h.randName();
  const done = { foo: false, bar: false, original: false };

  redis.subscribe('task-ok');

  redis.on('message', (chan, msg) => {
    if (chan !== 'task-ok') return;

    const task = JSON.parse(msg);
    if (task.empty == false && task.id === name) {
      done[task.version] = true;
    }
  });

  h.imgBuf((err, img) => {
    function addManifest(cb) {
      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ ids: [img.id] });
      const opts = { uri: `http://localhost:9295/${name}.json`, headers, body, };
      request.post(opts, cb);
    }

    function addImage(cb) {
      const headers = { 'content-type': 'image/jpeg' };
      const opts = { uri: `http://localhost:9295/${img.id}.jpg`, body: img.buf, };
      request.post(opts, cb);
    }

    async.parallel([
      (next) => addManifest(next),
      (next) => addImage(next)
    ], (err) => {
        t.ifError(err);

        request.post(
          { uri: `http://localhost:9293/api/album/${name}/reprocess` },
          (err, res) => {
            t.ifError(err);

            t.is(res.statusCode, 200);
            async.until(
              () => {
                return done.foo && done.bar && done.original;
              },
              (next) => setTimeout(next, 100),
              () => {
                async.parallel([
                  (next) => {
                    h.checkStoredImages(t, [`foo_${img.id}`, `bar_${img.id}`], next);
                  }
                ], (err) => {
                  t.ifError(err);
                  t.end();
                });
              }
            );
          }
        )
      }
    )
  });
});

test.cb('api: reprocess versions', (t) => {
  const name = h.randName();
  const done = { foo: false };

  redis.subscribe('task-ok');

  redis.on('message', (chan, msg) => {
    if (chan !== 'task-ok') return;

    const task = JSON.parse(msg);
    if (task.empty == false && task.id === name) {
      done[task.version] = true;
    }
  });

  h.imgBuf((err, img) => {
    function addManifest(cb) {
      const headers = { 'content-type': 'application/json' };
      const body = JSON.stringify({ ids: [img.id] });
      const opts = { uri: `http://localhost:9295/${name}.json`, headers, body, };
      request.post(opts, cb);
    }

    function addImage(cb) {
      const headers = { 'content-type': 'image/jpeg' };
      const opts = { uri: `http://localhost:9295/${img.id}.jpg`, body: img.buf, };
      request.post(opts, cb);
    }

    async.parallel([
      (next) => addManifest(next),
      (next) => addImage(next)
    ], (err) => {
        t.ifError(err);

        request.post(
          { uri: `http://localhost:9293/api/album/${name}/reprocess/foo` },
          (err, res) => {
            t.ifError(err);

            t.is(res.statusCode, 200);
            async.until(
              () => {
                return done.foo
              },
              (next) => setTimeout(next, 100),
              () => {
                async.parallel([
                  (next) => {
                    h.checkStoredImages(t, [`foo_${img.id}`], next);
                  }
                ], (err) => {
                  t.ifError(err);
                  t.end();
                });
              }
            );
          }
        )
      }
    )
  });
});
