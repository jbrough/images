const apis = require('./apis');

const app = require('./app')(apis());
const PORT = process.env.SF_RESIZER_PORT;
app.listen(PORT);
console.log(`SF_RESIZER listening on ${PORT}`);
