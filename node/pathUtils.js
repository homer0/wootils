const path = require('path');
const { provider } = require('jimple');
/**
 * A utility services to manage paths on a project. It allows for path building relatives to
 * the project root or from where the app executable is located.
 */
class PathUtils {
  /**
   * @param {string} [home=''] The location of the project's `home`(root) directory. By default
   *                           it uses `process.cwd()`.
   */
  constructor(home = '') {
    /**
     * The root path from where the app is being executed.
     *
     * @type {string}
     */
    this.path = process.cwd();
    /**
     * A dictionary of different path locations.
     *
     * @type {Object.<string,string>}
     */
    this.locations = {};

    this._addAppLocation();
    this.addLocation('home', home || this.path);
  }
  /**
   * Add a new location.
   *
   * @param {string} name         The reference name.
   * @param {string} locationPath The path of the location. It must be inside the path from the
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
    // Fix it so all the locations will end with a separator.
    if (!location.endsWith(path.sep)) {
      location = `${location}${path.sep}`;
    }
    // Add it to the dictionary.
    this.locations[name] = location;
  }
  /**
   * Get a location path by its name.
   *
   * @param {string} name The location name.
   * @returns {string}
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
   * Alias to `joinFrom` that uses the `home` location by default.
   *
   * @param {...string} paths The rest of the path components to join.
   * @returns {string}
   */
  join(...paths) {
    return this.joinFrom('home', ...paths);
  }
  /**
   * Build a path using a location path as base.
   *
   * @param {string}    location The location name.
   * @param {...string} paths    The rest of the path components to join.
   * @returns {string}
   */
  joinFrom(location, ...paths) {
    const locationPath = this.getLocation(location);
    return path.join(locationPath, ...paths);
  }
  /**
   * Get the path to the directory where the app executable is located.
   *
   * @returns {string}
   */
  get app() {
    return this.getLocation('app');
  }
  /**
   * Get the project root path.
   *
   * @returns {string}
   */
  get home() {
    return this.getLocation('home');
  }
  /**
   * Find and register the location for the app executable directory.
   *
   * @access protected
   * @ignore
   */
  _addAppLocation() {
    let current = module;
    while (
      current.parent &&
      current.parent.filename !== current.filename
    ) {
      current = current.parent;
    }

    this.addLocation('app', path.dirname(current.filename));
  }
}
/**
 * Generates a `Provider` with an already defined `home` location.
 *
 * @example
 * // Generate the provider
 * const provider = pathUtilsWithHome('my-path');
 * // Register it on the container
 * container.register(provider);
 * // Getting access to the service instance
 * const pathUtils = container.get('pathUtils');
 *
 * @param {string} [home] The path to the new home location.
 * @returns {Provider}
 */
const pathUtilsWithHome = (home) => provider((app) => {
  app.set('pathUtils', () => new PathUtils(home));
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `PathUtils` as the `pathUtils` service.
 *
 * @example
 * // Register it on the container
 * container.register(pathUtils);
 * // Getting access to the service instance
 * const pathUtils = container.get('pathUtils');
 * @type {Provider}
 */
const pathUtils = pathUtilsWithHome();

module.exports.PathUtils = PathUtils;
module.exports.pathUtils = pathUtils;
module.exports.pathUtilsWithHome = pathUtilsWithHome;
