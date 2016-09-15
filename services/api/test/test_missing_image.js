const test = require('ava');
const supertest = require('supertest');

const utils = require('./utils');

function fakeVersions() {
  return [{ foo: { x: 1, y: 1 } }];
}

function fakeApis(responses) {
  return {
    request: utils.request(responses),
  };
}

test.cb('/api/album/id returns image metadata from google storage', t => {
  const apis = fakeApis({
    get: {
      'http://localhost:9295/1.json': { json: { ids: ['1', '2'] } },
      'http://localhost:9295/1.jpg;metadata': { json: { name: '1.jpg' } },
      'http://localhost:9295/2.jpg;metadata': { json: { name: '2.jpg' } },
    }
  });
  const app = require('./../app')(apis, fakeVersions());

  supertest(app)
    .get('/api/album/1')
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, res) => {
      t.ifError(err);
      t.is(res.body[0].name, '1.jpg');
      t.is(res.body[0]._missing, undefined);
      t.is(res.body[1].name, '2.jpg');
      t.is(res.body[1]._missing, undefined);
      t.end();
    });
});

test.cb('/api/album/id returns fake metadata if image missing', t => {
  const apis = fakeApis({
    get: {
      'http://localhost:9295/1.json': { json: { ids: ['1', '2'] } },
      'http://localhost:9295/1.jpg;metadata': { json: { name: '1.jpg' } },
      'http://localhost:9295/2.jpg;metadata': { json: { name: '2.jpg' }, statusCode: 404 },
    }
  });
  const app = require('./../app')(apis, fakeVersions());

  supertest(app)
    .get('/api/album/1')
    .expect('Content-Type', /json/)
    .expect(200)
    .end((err, res) => {
      t.ifError(err);
      t.is(res.body[0].name, '1.jpg');
      t.falsy(res.body[0]._missing);
      t.is(res.body[1].name, '2.jpg');
      t.truthy(res.body[1]._missing);
      t.truthy(res.body[1].bucket);
      t.end();
    });
});
