const { provider } = require('jimple');

const rootRequire = (pathUtils) =>
  (path) =>
    // eslint-disable-next-line global-require,import/no-dynamic-require
    require(pathUtils.join(path));

const rootRequireProvider = provider((app) => {
  app.set('rootRequire', () => rootRequire(app.get('pathUtils')));
});

module.exports = {
  rootRequire,
  rootRequireProvider,
};
