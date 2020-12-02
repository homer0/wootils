/**
 * I'm using this extremely verbose syntax because it's the only way the transpilation
 * process would recognize both 'imports' and 'exports'.
 *
 * @ignore
 */

const APIClient = require('./apiClient');
const {
  DeepAssign,
  deepAssign,
  deepAssignWithConcat,
  deepAssignWithOverwrite,
  deepAssignWithShallowMerge,
} = require('./deepAssign');
const deferred = require('./deferred');
const EventsHub = require('./eventsHub');
const extendPromise = require('./extendPromise');
const {
  resource,
  resourceCreator,
  resourcesCollection,
  provider,
  providerCreator,
  providers,
  proxyContainer,
} = require('./jimpleFns');
const ObjectUtils = require('./objectUtils');

module.exports.APIClient = APIClient;
module.exports.DeepAssign = DeepAssign;
module.exports.deepAssign = deepAssign;
module.exports.deepAssignWithConcat = deepAssignWithConcat;
module.exports.deepAssignWithOverwrite = deepAssignWithOverwrite;
module.exports.deepAssignWithShallowMerge = deepAssignWithShallowMerge;
module.exports.deferred = deferred;
module.exports.EventsHub = EventsHub;
module.exports.extendPromise = extendPromise;
module.exports.resource = resource;
module.exports.resourceCreator = resourceCreator;
module.exports.resourcesCollection = resourcesCollection;
module.exports.provider = provider;
module.exports.providerCreator = providerCreator;
module.exports.providers = providers;
module.exports.proxyContainer = proxyContainer;
module.exports.ObjectUtils = ObjectUtils;
