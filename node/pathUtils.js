const path = require('path');
const { provider } = require('jimple');

class PathUtils {
  constructor(home = '') {
    this.path = path.join(process.cwd(), home);
  }

  join(...paths) {
    return path.join(this.path, ...paths);
  }
}

const pathUtilsWithHome = (home) => provider((app) => {
  app.set('pathUtils', () => new PathUtils(home));
});

const pathUtils = pathUtilsWithHome();

module.exports = {
  PathUtils,
  pathUtils,
  pathUtilsWithHome,
};
