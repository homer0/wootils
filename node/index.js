/**
 * I'm using this extremely verbose syntax because it's the only way the transpilation process
 * would recognize both 'imports' and 'exports'.
 *
 * @ignore
 */

const { AppConfiguration } = require('./appConfiguration');
const { EnvironmentUtils } = require('./environmentUtils');
const { ErrorHandler } = require('./errorHandler');
const { Logger } = require('./logger');
const { packageInfo } = require('./packageInfo');
const { PathUtils } = require('./pathUtils');
const { rootRequire } = require('./rootRequire');

module.exports.AppConfiguration = AppConfiguration;
module.exports.EnvironmentUtils = EnvironmentUtils;
module.exports.ErrorHandler = ErrorHandler;
module.exports.Logger = Logger;
module.exports.packageInfo = packageInfo;
module.exports.PathUtils = PathUtils;
module.exports.rootRequire = rootRequire;
