const fs = require('fs-extra');
const { provider } = require('jimple');

const packageInfo = (pathUtils) => fs.readJsonSync(pathUtils.join('package.json'));

const packageInfoProvider = provider((app) => {
  app.set('packageInfo', () => packageInfo(app.get('pathUtils')));
});

module.exports = {
  packageInfo,
  packageInfoProvider,
};
