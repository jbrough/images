const request = require('request');
const sharp = require('sharp');
const async = require('async');
const upload = require(__dirname + '/../services/api/upload');

sharp.cache(0);

function randName() {
  return Math.random().toString(32).substr(2);
}

function imgBuf(cb) {
  function buf() {
    // a 1x1 tansparent png image
    return Buffer.from(
      'ffd8ffe000104a46494600010100000100010000ffdb004300030202020202030202020303030304060404040404080606050609080a0a090809090a0c0f0c0a0b0e0b09090d110d0e0f101011100a0c12131210130f101010ffdb00430103030304030408040408100b090b1010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010ffc00011080001000103011100021101031101ffc40014000100000000000000000000000000000009ffc40014100100000000000000000000000000000000ffc40014010100000000000000000000000000000000ffc40014110100000000000000000000000000000000ffda000c03010002110311003f0054c1ffd9',
      'hex'
    )
  }
  function v() { return parseInt(Math.random() * 256); }

  // images are strongly named at the server according to
  // their content so we need to make the content random.
  // Make sure the source buffer is RGB, though! Woops.
  // If it's Grayscale you'll get duplicates, 256 vs
  // 16 million combinations.
  sharp(buf())
  .resize(5, 6)
  .background(`#${('00000'+(Math.random()*(1<<24)|0).toString(16)).slice(-6)}`)
  .embed()
  .jpeg()
  .toBuffer((err, b) => {
    if (err) return cb(err);

    cb(null, upload(b));
  });
}

function imgBufs(cb) {
  imgBuf((err1, b1) => {
    if (err1) return cb(err1);

    console.log(b1.id);

    imgBuf((err2, b2) => {
      if (err2) return cb(err2);

      cb(null, [b1, b2]);
    });
  });
}

function checkResponse(t, body) {
  const res = JSON.parse(body);
  t.true(res.length > 0, 'reponse includes metadata objects');
  res.map((n) => {
    t.truthy(n.name, 'response metadata includes filename')
  });
}

function checkStoredImages(t, ids, cb) {
  async.each(
    ids.map((n) => { return { uri: `https://storage.googleapis.com/silkfred/${n}.jpg`, }; }),
    (opts, next) => {
      request.get(opts, (err, res, body) => {
        t.ifError(err);
        t.is(res.statusCode, 200, `${opts.uri} has 200 status code`);
        t.is(
          res.headers['x-goog-meta-sf-original-size'],
          '5x6',
          `${opts.uri} has sf-original-size response header`
        );
        t.is(
          res.headers['cache-control'],
          'max-age=31536000',
          `${opts.uri} has 1 year max-age cache-control response header`
        );
        next();
      });
    },
    (err) => {
      t.ifError(err);
      return cb();
    }
  );
}

function checkManifest(t, id, expected, cb) {
  request.get(
    { uri: `https://storage.googleapis.com/silkfred/${id}.json`, json:true },
    (err, res, body) => {
      t.ifError(err);
      t.is(res.headers['cache-control'], 'no-cache', 'manifest has cache-control set');
      t.deepEqual(
        body.ids,
        expected,
        'manifest has image ids in correct order'
      );
      return cb();
    }
  );
}

module.exports = {
  randName,
  imgBuf,
  imgBufs,
  checkResponse,
  checkStoredWellknownImages,
  checkStoredImages,
  checkManifest,
};
