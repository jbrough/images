const config = require('./config')();
const apis = require('./apis')();

const app = require('./app')(apis, config.versions);

const PORT = process.env.SF_API_PORT;
app.listen(PORT);
console.log(`SF_API listening on ${PORT}`);
