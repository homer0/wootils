const path = require('path');
const { provider } = require('jimple');

class PathUtils {
  constructor(home = '') {
    this.path = process.cwd();
    this.locations = {};

    this._addAppLocation();
    this.addLocation('home', home || this.path);
  }

  addLocation(name, locationPath) {
    let location = locationPath;
    if (location !== this.path && !location.startsWith(this.path)) {
      location = path.join(this.path, location);
    }

    if (!location.endsWith('/')) {
      location = `${location}/`;
    }

    this.locations[name] = location;
  }

  getLocation(name) {
    const location = this.locations[name];
    if (!location) {
      throw new Error(`There's no location with the following name: ${name}`);
    }

    return location;
  }

  joinFrom(location, ...paths) {
    const locationPath = this.getLocation(location);
    return path.join(locationPath, ...paths);
  }

  join(...paths) {
    return this.joinFrom('home', ...paths);
  }

  get home() {
    return this.getLocation('home');
  }

  get app() {
    return this.getLocation('app');
  }

  _addAppLocation() {
    let current = module;
    while (current.parent) {
      current = current.parent;
    }

    this.addLocation('app', path.dirname(current.filename));
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
