const spawn = require('child_process').spawn;

const env = process.env;
env.NODE_ENV = 'development';

const api = spawn('node', ['./services/api/server.js', { env }]);
const resizer = spawn('node', ['./services/resizer/server.js']);
const storage = spawn('node', ['./services/storage/server.js']);
const queue = spawn('node', ['./services/queue/server.js']);
const task = spawn('node', ['./services/task/index.js']);

const client = spawn('node', ['./services/client/node_modules/webpack-dev-server/bin/webpack-dev-server.js', '--content-base', './services/client/_dist']);

api.stdout.on('data', (data) => { console.log(`[stdout] [api]: ${data}`); });
api.stderr.on('data', (data) => { console.log(`[stderr] [api]: ${data}`); });
api.on('close', (code) => { console.log(`api child process exited with code ${code}`); });

resizer.stdout.on('data', (data) => { console.log(`[stdout] [resizer]: ${data}`); });
resizer.stderr.on('data', (data) => { console.log(`[stderr] [resizer]: ${data}`); });
resizer.on('close', (code) => { console.log(`resizer child process exited with code ${code}`); });

storage.stdout.on('data', (data) => { console.log(`[stdout] [storage]: ${data}`); });
storage.stderr.on('data', (data) => { console.log(`[stdout] [storage]: ${data}`); });
storage.on('close', (code) => { console.log(`storage child process exited with code ${code}`); });

queue.stdout.on('data', (data) => { console.log(`[stdout] [queue]: ${data}`); });
queue.stderr.on('data', (data) => { console.log(`[stdout] [queue]: ${data}`); });
queue.on('close', (code) => { console.log(`queue child process exited with code ${code}`); });

task.stdout.on('data', (data) => { console.log(`[stdout] [task]: ${data}`); });
task.stderr.on('data', (data) => { console.log(`[stdout] [task]: ${data}`); });
task.on('close', (code) => { console.log(`task child process exited with code ${code}`); });

client.stdout.on('data', (data) => { console.log(`[stdout] [webpack]: ${data}`); });
client.stderr.on('data', (data) => { console.log(`[stdout] [webpack]: ${data}`); });
client.on('close', (code) => { console.log(`webpack child process exited with code ${code}`); });
