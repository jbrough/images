const spawn = require('child_process').spawn;
const async = require('async');

const env = process.env;
env.NODE_ENV = 'test';

module.exports = (testName, includeTask) => {
  const api = spawn('node', ['./services/api/server.js'],  { env });
  const resizer = spawn('node', ['./services/resizer/server.js']);
  const storage = spawn('node', ['./services/storage/server.js']);
  const queue = spawn('node', ['./services/queue/server.js']);

  const up = { api: false, resizer: false, storage: false, queue: false, task: false };

  api.stdout.on('data', (data) => { up.api = true; console.log(`[stdout] [api]: ${data}`); });
  api.stderr.on('data', (data) => { console.log(`[stderr] [api]: ${data}`); });
  api.on('close', (code) => { console.log(`api child process exited with code ${code}`); });

  resizer.stdout.on('data', (data) => { up.resizer = true; console.log(`[stdout] [resizer]: ${data}`); });
  resizer.stderr.on('data', (data) => { console.log(`[stderr] [resizer]: ${data}`); });
  resizer.on('close', (code) => { console.log(`resizer child process exited with code ${code}`); });

  storage.stdout.on('data', (data) => { up.storage = true; console.log(`[stdout] [storage]: ${data}`); });
  storage.stderr.on('data', (data) => { console.log(`[stdout] [storage]: ${data}`); });
  storage.on('close', (code) => { console.log(`storage child process exited with code ${code}`); });

  queue.stdout.on('data', (data) => { up.queue = true; console.log(`[stdout] [queue]: ${data}`); });
  queue.stderr.on('data', (data) => { console.log(`[stdout] [queue]: ${data}`); });
  queue.on('close', (code) => { console.log(`queue child process exited with code ${code}`); });

  let task;
  if (includeTask) {
    task = spawn('node', ['./services/task/index.js']);
    task.stdout.on('data', (data) => { up.task = true; console.log(`[stdout] [task]: ${data}`); });
    task.stderr.on('data', (data) => { console.log(`[stdout] [task]: ${data}`); });
    task.on('close', (code) => { console.log(`task child process exited with code ${code}`); });
  }

  function run() {
    const test = spawn('./node_modules/ava/cli.js', ['-v', `./test/${testName}.js`], { env } );

    test.stdout.on('data', (data) => { console.log(`[stdout] [test]: ${data}`); });
    test.stderr.on('data', (data) => { console.log(`[stdout] [test]: ${data}`); });
    test.on('close', (code) => {
      console.log(`test child process exited with code ${code}`);
      api.kill();
      resizer.kill();
      storage.kill();
      queue.kill();
      if (includeTask) task.kill();
    });
  }

  async.until(
    () => {
      const services = up.api && up.resizer && up.storage && up.queue;
      return includeTask ? services && up.task : services;
    },
    (next) => setTimeout(next, 100),
    run
  );
}
