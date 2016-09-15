const test = require('ava');
const request = require('request');
const async = require('async');
const redis = require('redis').createClient();
const sharp = require('sharp');

const h = require('./utils');

test.cb('resizer: resizing image', (t) => {
  h.imgBuf((err, img) => {
    t.ifError(err);

    const opts = { uri: 'http://localhost:9294/3,2', encoding: null, body: img.buf };
    request.post(opts, (err, res, body) => {
      t.ifError(err);
      t.is(res.statusCode, 200, 'returns HTTP 200');
      t.is(res.headers['x-original-size'], '5x6', 'returns original dimensions in x-original-size');
      sharp(body).metadata((err, m) => {
        t.ifError(err, 'response buffer is an image');
        t.is(m.width, 3, 'resized width to 3 pixels');
        t.is(m.height, 2, 'resized height to 2 pixels');
        t.end();
      });
    });
  });
});

test.cb('storage: storing image', (t) => {
  const name = h.randName();

  h.imgBuf((err, img) => {
    t.ifError(err);

    const headers = { 'content-type': 'image/jpeg', 'cache-control': 'no-cache', 'sf-custom': 'Foo' };
    const opts = { uri: `http://localhost:9295/${name}.jpg`, encoding: null, body: img.buf, headers };
    request.post(opts, (err, res, body) => {
      t.ifError(err);
      t.is(res.statusCode, 201, 'returns HTTP 201');
      t.is(
        res.headers['location'],
        `https://storage.googleapis.com/silkfred/${name}.jpg`,
        'returns location header'
      );

      async.parallel([
        (done) => {
          const opts = { uri: `http://localhost:9295/${name}.jpg;metadata`, json:true, };
          request.get(opts, (err, res, body) => {
            t.ifError(err);
            t.is(res.statusCode, 200, 'get metadata returns HTTP 200');
            t.is(body.metadata['sf-custom'], 'Foo', 'uploader set custom metadata')
            t.is(body.cacheControl, 'no-cache', 'uploader set cache-control')
            t.is(body.contentType, 'image/jpeg', 'uploader set content-type')
            done();
          });
        },
        (done) => {
          const opts = { uri: `http://localhost:9295/${name}.jpg`, encoding:null, };
          request.get(opts, (err, res, body) => {
            t.ifError(err);
            t.is(res.statusCode, 200, 'get file returns HTTP 200');
            sharp(body).metadata((imgErr) => {
              t.ifError(imgErr, 'response buffer is readable as an image');
              done();
            })
          });
        }
      ], t.end)
    });
  });
});

test.cb('storage: 404', (t) => {
  const name = h.randName();

  const opts = { uri: `http://localhost:9295/${name}`, };
  request.get(opts, (err, res, body) => {
    t.ifError(err, 'did not.ifError');
    t.is(res.statusCode, 404, 'returns 404 if object not found');
    t.end();
  });
});

test.cb('storage: get json', (t) => {
  const name = h.randName();

  const headers = { 'content-type': 'application/json' };
  const body = JSON.stringify({ foo: 'bar' });
  const opts = { uri: `http://localhost:9295/${name}.json`, body, };
  request.post(opts, (err, res, body) => {
    t.ifError(err);
    t.is(res.statusCode, 201, 'returns HTTP 201');
    const opts = { uri: `http://localhost:9295/${name}.json`, json:true, };
    request.get(opts, (err, res, body) => {
      t.is(body.foo, 'bar', 'body is readable as json');
      t.end();
    });
  });
});

test.cb('api: add images', (t) => {
  const name = h.randName();

  h.imgBufs((err, imgs) => {
    t.ifError(err);
    async.timesSeries(
      2,
      (n, next) => {
        request.post(
          { uri: `http://localhost:9293/api/album/${name}/image/add`, body: imgs[n].buf, encoding:null, },
          (err, res, body) => {
            t.ifError(err);
            t.is(res.statusCode, 200, 'adding an image returns HTTP 200');
            h.checkResponse(t, body);
            next();
          }
        );
      },
      (err) => {
        t.ifError(err);
        async.parallel([
          (next) => {
            h.checkManifest(
              t,
              name,
              imgs.map((n) => n.id),
              next
            )
          },
          (next) => {
            const prefixes = ['', 'foo_', 'bar_'];
            const ids = prefixes.map((n) => `${n}${imgs[0].id}`).concat(
                prefixes.map((n) => `${n}${imgs[1].id}`));

            h.checkStoredImages(t, ids, next);
          },
        ], (err) => {
          t.ifError(err);
          t.end();
        });
      }
    );
  });
});

test.cb('api: move image', (t) => {
  const name = h.randName();

  h.imgBufs((err, imgs) => {
    t.ifError(err);

    async.timesSeries(
      2,
      (n, next) => {
        request.post(
          { uri: `http://localhost:9293/api/album/${name}/image/add`, body: imgs[n].buf, encoding:null, },
          (err, res, body) => {
            t.ifError(err);
            return next();
          }
        );
      },
      (err) => {
        t.ifError(err);
        async.series([
          (next) => {
            h.checkManifest(
              t,
              name,
              imgs.map((n) => n.id),
              next
            )
          },
          (next) => {
            request.post(
              { uri: `http://localhost:9293/api/album/${name}/image/${imgs[1].id}/move/0`, },
              (err, res, body) => {
                t.ifError(err);
                h.checkResponse(t, body);
                next()
              }
            )
          },
          (next) => {
            h.checkManifest(
              t,
              name,
              imgs.map((n) => n.id).reverse(),
              next
            )
          },
        ], (err) => {
          t.ifError(err);
          t.end();
        });
      }
    );
  });
});

test.cb('api: delete image', (t) => {
  const name = h.randName();

  h.imgBufs((err, imgs) => {
    t.ifError(err)

    async.timesSeries(
      2,
      (n, next) => {
        request.post(
          { uri: `http://localhost:9293/api/album/${name}/image/add`, body: imgs[n].buf, encoding:null, },
          (err, res, body) => {
            t.ifError(err);
            return next();
          }
        );
      },
      (err) => {
        t.ifError(err);
        async.series([
          (next) => {
            h.checkManifest(
              t,
              name,
              imgs.map((n) => n.id),
              next
            )
          },
          (next) => {
            request.delete(
              { uri: `http://localhost:9293/api/album/${name}/image/${imgs[0].id}`, },
              (err, res, body) => {
                t.ifError(err);
                h.checkResponse(t, body);
                next()
              }
            )
          },
          (next) => {
            h.checkManifest(
              t,
              name,
              [imgs[1].id],
              next
            )
          },
        ], (err) => {
          t.ifError(err);
          t.end();
        });
      }
    );
  });
});

test.cb('api: delete album', (t) => {
  const name = h.randName();

  h.imgBuf((err, img) => {
    t.ifError(err)

    request.post(
      { uri: `http://localhost:9293/api/album/${name}/image/add`, body: img.buf, encoding:null, },
      (err, res, body) => {
        t.ifError(err);

        async.series([
          (next) => {
            h.checkManifest(
              t,
              name,
              [img.id],
              next
            )
          },
          (next) => {
            request.delete(
              { uri: `http://localhost:9293/api/album/${name}`, },
              (err, res, body) => {
                t.ifError(err);
                t.deepEqual(JSON.parse(body), [], 'returns empty album metadata');
                next()
              }
            )
          },
          (next) => {
            h.checkManifest(
              t,
              name,
              [ ],
              next
            )
          }
        ], (err) => {
          t.ifError(err);
          t.end();
        });
      }
    );
  });
});

test.cb('api: metadata endpoint', (t) => {
  const name = h.randName();

  h.imgBuf((err, img) => {
    t.ifError(err)

    request.post(
      { uri: `http://localhost:9293/api/album/${name}/image/add`, body: img.buf, encoding:null, },
      (err, res, body) => {
        t.ifError(err);
        request.get(
          { uri: `http://localhost:9293/api/album/${name}`, json:true },
          (err, res, body) => {
            t.ifError(err);
            t.is(body[0].name, `${img.id}.jpg`, 'returns metadata');
            t.end();
          }
        )
      }
    );
  });
});

test.cb('queue: adding tasks', (t) => {
  redis.flushall();

  const task = { id: 'foo', version: 'bar' };
  const body = JSON.stringify(task);
  async.times(
    2,
    (n, next) => {
      request.post(
        { uri: 'http://localhost:9296/add', body },
        (err, res) => {
          t.ifError(err);
          t.is(res.statusCode, 201);
          next()
        }
      );
    },
    () => {
      async.series([
        (next) => {
          request.get(
            { uri: 'http://localhost:9296/stats', json:true },
            (err, res, body) => {
              t.ifError(err);

              t.is(res.statusCode, 200);
              t.is(body.pending, 1, 'only adds unique tasks');
              next()
            }
          );
        },
        (next) => {
          request.post(
            { uri: 'http://localhost:9296/next', json:true },
            (err, res, body) => {
              t.ifError(err);

              t.is(res.statusCode, 200);
              t.false(body.empty, 'empty:false flags the queue is not empty');
              t.deepEqual(body.item, task);
              next()
            }
          );
        },
        (next) => {
          request.post(
            { uri: 'http://localhost:9296/next', json:true },
            (err, res, body) => {
              t.ifError(err);
              t.is(res.statusCode, 200);
              t.true(body.empty);
              next()
            }
          );
        },
        () => t.end()
      ])
    }
  )
});
