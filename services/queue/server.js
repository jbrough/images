const apis = require('./apis');

const app = require('./app')(apis());
const PORT = process.env.SF_QUEUE_PORT;
app.listen(PORT);
console.log(`SF_QUEUE listening on ${PORT}`);
