const apis = require('./apis');

const app = require('./app')(apis());
const PORT = process.env.SF_STORAGE_PORT;
app.listen(PORT);
console.log(`SF_STORAGE listening on ${PORT}`);
