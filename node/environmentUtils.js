const { provider } = require('jimple');

class EnvironmentUtils {
  constructor() {
    this.env = this.get('NODE_ENV', 'development');
    this.production = this.env === 'production';
  }

  get(name, defaultValue = '') {
    // eslint-disable-next-line no-process-env
    let value = process.env[name];
    if (typeof value === 'undefined') {
      value = defaultValue;
    }

    return value;
  }

  get development() {
    return !this.production;
  }
}

const environmentUtils = provider((app) => {
  app.set('environmentUtils', () => new EnvironmentUtils());
});

module.exports = {
  EnvironmentUtils,
  environmentUtils,
};
