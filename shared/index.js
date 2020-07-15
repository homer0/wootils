/**
 * I'm using this extremely verbose syntax because it's the only way the transpilation process
 * would recognize both 'imports' and 'exports'.
 *
 * @ignore
 */

const APIClient = require('./apiClient');
const deferred = require('./deferred');
const EventsHub = require('./eventsHub');
const extendPromise = require('./extendPromise');
const ObjectUtils = require('./objectUtils');

module.exports.APIClient = APIClient;
module.exports.deferred = deferred;
module.exports.EventsHub = EventsHub;
module.exports.extendPromise = extendPromise;
module.exports.ObjectUtils = ObjectUtils;
