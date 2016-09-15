const yaml = require('js-yaml');
const fs = require('fs');
const ENV = process.env.NODE_ENV;

module.exports = () => {

  let versions;
  if (process.env.NODE_ENV == "test") {
    versions = { foo: { x: 10, y: 10 }, bar: { x: 5, y: 5 } };
  } else {
    versions = yaml.safeLoad(fs.readFileSync(`${__dirname}/versions.yaml`, 'utf8'));
  }

  return {
    config: yaml.safeLoad(fs.readFileSync(`${__dirname}/config.yaml`, 'utf8'))[ENV],
    versions
  };
};
