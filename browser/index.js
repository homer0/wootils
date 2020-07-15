/**
 * I'm using this extremely verbose syntax because it's the only way the transpilation process
 * would recognize both 'imports' and 'exports'.
 *
 * @ignore
 */

const SimpleStorage = require('./simpleStorage');

module.exports.SimpleStorage = SimpleStorage;
