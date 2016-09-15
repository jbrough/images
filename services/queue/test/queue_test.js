const test = require('ava');
const redis = require('redis').createClient();
const async = require('async');

const MAX_RETRIES = 3

const queue = require('../queue')(redis, MAX_RETRIES);

test.cb('retry errors', (t) => {
  function setup(n, cb) {
    const task = { id: 1, version: 'foo' };
    if (n) task.retries = n;

    async.series([
      (next) => redis.flushall(next),
      (next) => redis.sadd('tasks_err', JSON.stringify(task), next),
      (next) => queue.retry(next)
    ], cb);
  }

  async.series([
    (next) => {
      setup(null, (err) => {
        t.ifError(err);

        async.parallel([
          (nextp) => {
            redis.spop('tasks', (err, res) => {
              t.ifError(err);
              t.truthy(res);
              t.deepEqual(
                JSON.parse(res),
                { id: 1, version: 'foo', retries: 1 },
                'task requeued with retries added and set to 1'
              );
              nextp()
            })
          },
          (nextp) => {
            redis.scard('tasks_err', (err, res) => {
              t.ifError(err);
              t.is(res, 0, 'task removed from error queue');
              nextp()
            })
          }
        ], next);
      })
    },
    (next) => {
      setup(1, (err) => {
        t.ifError(err);

        async.parallel([
          (nextp) => {
            redis.spop('tasks', (err, res) => {
              t.ifError(err);
              t.deepEqual(
                JSON.parse(res),
                { id: 1, version: 'foo', retries: 2 },
                'task requeued with retries incremented'
              );
              nextp()
            })
          },
          (nextp) => {
            redis.scard('tasks_err', (err,res) => {
              t.ifError(err);
              t.is(res, 0, 'task removed from error queue');
              nextp()
            })
          }
        ], next);
      });
    },
    (next) => {
      setup(2, (err) => {
        t.ifError(err);

        async.parallel([
          (nextp) => {
            redis.spop('tasks_err', (err, res) => {
              t.ifError(err);
              t.truthy(res);
              t.deepEqual(
                JSON.parse(res),
                { id: 1, version: 'foo', retries: 2 },
                'task left on error queue'
              );
              nextp()
            })
          },
          (nextp) => {
            redis.scard('tasks', (err, res) => {
              t.ifError(err);
              t.is(res, 0, 'task not added to pending queue');
              nextp()
            })
          }
        ], next);
      });
    }
  ], t.end);
});
