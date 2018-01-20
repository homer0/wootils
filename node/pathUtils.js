const path = require('path');
const { provider } = require('jimple');
/**
 * A utility services to manage paths on a project. It allows for path building relatives to
 * the project root or from where the app executable is located.
 */
class PathUtils {
  /**
   * Class constructor.
   * @param {String} [home=''] The location of the project's `home`(root) directory. By default
   *                           it uses `process.cwd()`.
   */
  constructor(home = '') {
    /**
     * The root path from where the app is being executed.
     * @type {String}
     */
    this.path = process.cwd();
    /**
     * A dictionary of different path locations.
     * @type {Object}
     */
    this.locations = {};

    this._addAppLocation();
    this.addLocation('home', home || this.path);
  }
  /**
   * Add a new location.
   * @param {String} name         The reference name.
   * @param {String} locationPath The path of the location. It must be inside the path from the
   *                              app is being executed.
   */
  addLocation(name, locationPath) {
    let location = locationPath;
    /**
     * If it doesn't starts with the root location, then prefix it with it. The project should
     * never attempt to access a location outside its directory.
     */
    if (location !== this.path && !location.startsWith(this.path)) {
      location = path.join(this.path, location);
    }
    // Fix it so all the locations will end with `/`.
    if (!location.endsWith('/')) {
      location = `${location}/`;
    }
    // Add it to the dictionary.
    this.locations[name] = location;
  }
  /**
   * Get a location path by its name.
   * @param {String} name The location name.
   * @return {String}
   * @throws {Error} If there location hasn't been added.
   */
  getLocation(name) {
    const location = this.locations[name];
    if (!location) {
      throw new Error(`There's no location with the following name: ${name}`);
    }

    return location;
  }
  /**
   * Build a path using a location path as base.
   * @param {String} location The location name.
   * @param {Array}  paths    The rest of the path components to join.
   * @return {String}
   */
  joinFrom(location, ...paths) {
    const locationPath = this.getLocation(location);
    return path.join(locationPath, ...paths);
  }
  /**
   * Alias to `joinFrom` that uses the `home` location by default.
   * @param {Array} paths The rest of the path components to join.
   * @return {String}
   */
  join(...paths) {
    return this.joinFrom('home', ...paths);
  }
  /**
   * Get the project root path.
   * @return {String}
   */
  get home() {
    return this.getLocation('home');
  }
  /**
   * Get the path to the directory where the app executable is located.
   * @return {String}
   */
  get app() {
    return this.getLocation('app');
  }
  /**
   * Find and register the location for the app executable directory.
   * @ignore
   * @access protected
   */
  _addAppLocation() {
    let current = module;
    while (current.parent) {
      current = current.parent;
    }

    this.addLocation('app', path.dirname(current.filename));
  }
}
/**
 * Generates a `Provider` with an already defined `home` location.
 * @example
 * // Generate the provider
 * const provider = pathUtilsWithHome('my-path');
 * // Register is on the container
 * container.register(provider);
 * // Getting access to the service instance
 * const pathUtils = container.get('pathUtils');
 * @return {Provider}
 */
const pathUtilsWithHome = (home) => provider((app) => {
  app.set('pathUtils', () => new PathUtils(home));
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `PathUtils` as the `pathUtils` service.
 * @example
 * // Register is on the container
 * container.register(pathUtils);
 * // Getting access to the service instance
 * const pathUtils = container.get('pathUtils');
 * @type {Provider}
 */
const pathUtils = pathUtilsWithHome();

module.exports = {
  PathUtils,
  pathUtils,
  pathUtilsWithHome,
};
