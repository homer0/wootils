const statuses = require('statuses');
const urijs = require('urijs');
const ObjectUtils = require('./objectUtils');
/**
 * @typedef {Function:(string,Object):Promise<Object,Error>} FetchClient
 */

/**
 * @typedef {Object} FetchOptions
 * @property {string}  method  The request method.
 * @property {Object}  headers The request headers.
 * @property {string}  body    The request body.
 * @property {boolean} json    Whether or not the response should _"JSON decoded"_.
 */

/**
 * @typedef {Object} APIClientEndpoint
 * @property {String}  path  The path to the endpoint relative to the API entry point. It can
 *                           include placeholders with the format `:placeholder-name` that are
 *                           going to be replaced when the endpoint gets generated.
 * @property {?Object} query A dictionary of query string parameters that will be added when the
 *                           endpoint. If the value of a parameter is `null`, it won't be added.
 */

/**
 * @typedef {Object} APIClientEndpoints
 * @property {string|APIClientEndpoints|APIClientEndpoint} [endpointName] A name for the endpoint
 *                                                                        that will be used to
 *                                                                        reference it on the
 *                                                                        `endpoint(...)` method.
 * @example
 * {
 *   // Endpoint path as a string.
 *   endpointOne: 'endpoint-one',
 *   // Endpoint as {APIClientEndpoint}.
 *   endpointTwo: {
 *     path: 'endpoint-two',
 *     query: {
 *       count: 20,
 *     },
 *   },
 *   // Endpoint as a dictionary of endpoints ({APIClientEndpoints}).
 *   endpointThree: {
 *     subEndpointThreeOne: 'sub-endpoint-three-one',
 *     subEndpointThreeTwo: {
 *       path: 'sub-endpoint-three-two',
 *       query: {
 *         count: 20,
 *       },
 *     },
 *   },
 * }
 */

/**
 * An API client with configurable endpoints.
 */
class APIClient {
  /**
   * Class constructor.
   * @param {String}                  url                 The API entry point.
   * @param {APIClientEndpoints}      endpoints           A dictionary of named endpoints relative
   *                                                      to the API entry point.
   * @param {FetchClient}             fetchClient         The fetch function that makes the
   *                                                      requests.
   * @param {Object}                  [defaultHeaders={}] A dictionary of default headers to
   *                                                      include on every request.
   */
  constructor(url, endpoints, fetchClient, defaultHeaders = {}) {
    /**
     * The API entry point.
     * @type {String}
     */
    this.url = url;
    /**
     * A dictionary of named endpoints relative to the API entry point.
     * @type {Object}
     * @property {string|APIClientEndpoint} [endpointName] The name of the endpoint.
     */
    this.endpoints = this.flattenEndpoints(endpoints);
    /**
     * The fetch function that makes the requests.
     * @type {FetchClient}
     */
    this.fetchClient = fetchClient;
    /**
     * A dictionary of default headers to include on every request.
     * @type {Object}
     */
    this.defaultHeaders = defaultHeaders;
    /**
     * An authorization token to include on the requests.
     * @type {String}
     */
    this.authorizationToken = '';
  }
  /**
   * Makes a `DELETE` request.
   * @param {String}       url          The request URL.
   * @param {Object}       body         The request body.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  delete(url, body = {}, options = {}) {
    return this.post(url, body, { method: 'delete', ...options });
  }
  /**
   * Generates an endpoint URL.
   * @param {String} name            The name of the endpoint on the `endpoints` property.
   * @param {Object} [parameters={}] A dictionary of values that will replace placeholders on the
   *                                 endpoint definition.
   * @return {String}
   * @throws {Error} If the endpoint doesn't exist on the `endpoints` property.
   */
  endpoint(name, parameters = {}) {
    // Get the endpoint information.
    const info = this.endpoints[name];
    // Validate that the endpoint exists.
    if (!info) {
      throw new Error(`Trying to request unknown endpoint: ${name}`);
    }
    // Get a new reference for the parameters.
    const params = { ...parameters };
    // If the endpoint is a string, format it into an object with `path`.
    const endpoint = typeof info === 'string' ? { path: info } : info;
    // Define the object that will have the query string.
    const query = {};
    // If the endpoint has a `query` property...
    if (endpoint.query) {
      // ...Loog all the query parameters.
      Object.keys(endpoint.query).forEach((queryName) => {
        // Get the defined value of the parameter.
        const queryValue = endpoint.query[queryName];
        // If there's a value of this parameter on the received `parameters`...
        if (typeof params[queryName] !== 'undefined') {
          // ...add it to the query dictionary.
          query[queryName] = params[queryName];
          // Remove the used parameter.
          delete params[queryName];
        } else if (queryValue !== null) {
          // If the default value of the parameter is not `null`, use it.
          query[queryName] = queryValue;
        }
      });
    }
    // Get the endpoint path.
    let { path } = endpoint;
    // Loop all the received `parameters`...
    Object.keys(params).forEach((parameter) => {
      // Build how a placeholder for this parameter would look like.
      const placeholder = `:${parameter}`;
      // Get the parameter value.
      const value = params[parameter];
      // If the path has the placeholder...
      if (path.includes(placeholder)) {
        // ...replace the placeholder with the value.
        path = path.replace(placeholder, value);
      } else {
        // ...otherwise, add it on the query string.
        query[parameter] = value;
      }
    });
    // Convert the URL into a `urijs` object.
    const uri = urijs(`${this.url}/${path}`);
    // Loop and add all the query string parameters.
    Object.keys(query).forEach((queryName) => {
      uri.addQuery(queryName, query[queryName]);
    });
    // Return the `urijs` object as a string.
    return uri.toString();
  }
  /**
   * Formats an error response into a proper Error object.
   * @param {Object} response A received response from a request.
   * @return {Error}
   */
  error(response) {
    return new Error(response.error);
  }
  /**
   * Makes a request.
   * @param {Object}  options         The request options.
   * @param {string}  options.url     The request URL.
   * @param {string}  options.method  The request method. `GET` by default.
   * @param {Object}  options.body    A request body to send.
   * @param {Object}  options.headers The request headers.
   * @param {boolean} options.json    Whether or not the response should _"JSON decoded"_. `true`
   *                                  by default.
   * @return {Promise<Object,Error>}
   */
  fetch(options) {
    // Get a new reference of the request options.
    const opts = { ...options };
    // Format the request method and check if it should use the default.
    opts.method = opts.method ? opts.method.toUpperCase() : 'GET';
    // Get the request headers.
    const headers = this.headers(opts.headers);
    // This check is to avoid pushing an empty object on the request options.
    if (Object.keys(headers).length) {
      opts.headers = headers;
    }
    // Format the flag the method will use to decided whether to decode the response or not.
    const handleAsJSON = typeof opts.json === 'boolean' ? opts.json : true;
    const { url } = opts;
    // Remove the necessary options in order to make it a valid `FetchOptions` object.
    delete opts.url;
    delete opts.json;
    // If the options include a body...
    if (opts.body) {
      // Let's first check if there are headers and if a `Content-Type` has been set.
      let hasContentType = false;
      if (opts.headers) {
        hasContentType = Object.keys(opts.headers)
        .find((name) => name.toLowerCase() === 'content-type');
      } else {
        opts.headers = {};
      }
      // If the body is an object...
      if (typeof opts.body === 'object') {
        // ...and if it's an object literal...
        if (Object.getPrototypeOf(opts.body).constructor.name === 'Object') {
          // ...encode it.
          opts.body = JSON.stringify(opts.body);
        }
        // If no `Content-Type` was defined, let's assume is a JSON request.
        if (!hasContentType) {
          opts.headers['Content-Type'] = 'application/json';
        }
      }
    }

    let responseStatus;
    // Make the request.
    return this.fetchClient(url, opts)
    .then((response) => {
      // Capture the response status.
      responseStatus = response.status;
      let nextStep;
      // If the response should be handled as JSON and it has a `json()` method...
      if (handleAsJSON && typeof response.json === 'function') {
        /**
         * Since some clients fail to decode an empty response, we'll try to decode it, but if it
         * fails, it will return an empty object.
         */
        nextStep = response.json().catch(() => ({}));
      } else {
        // If the response shouldn't be handled as JSON, set to return the raw object.
        nextStep = response;
      }

      return nextStep;
    })
    .then((response) => (
      /**
       * If the response status is from an Error, format and return the error; otherwise, return
       * the same response.
       */
      responseStatus >= statuses('bad request') ?
        Promise.reject(this.error(response, responseStatus)) :
        response
    ));
  }
  /**
   * Takes a dictionary of endpoints and flatten them on a single level.
   * The method just calls {@link ObjectUtils.flat}.
   * @param {APIClientEndpoints} endpoints A dictionary of named endpoints.
   * @return {Object}
   */
  flattenEndpoints(endpoints) {
    return ObjectUtils.flat(
      endpoints,
      '.',
      '',
      (ignore, value) => typeof value.path === 'undefined',
    );
  }
  /**
   * Makes a `GET` request.
   * @param {String}       url          The request URL.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  get(url, options = {}) {
    return this.fetch({ url, ...options });
  }
  /**
   * Makes a `HEAD` request.
   * @param {String}       url          The request URL.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  head(url, options = {}) {
    return this.get(url, { ...options, method: 'head' });
  }
  /**
   * Generates a dictionary of headers using the service `defaultHeaders` property as base.
   * If a token was set using `setAuthorizationToken`, the method will add an `Authorization`
   * header for the bearer token.
   * @param {Object} [overwrites={}] Extra headers to add.
   * @return {Object}
   */
  headers(overwrites = {}) {
    const headers = { ...this.defaultHeaders };
    if (this.authorizationToken) {
      headers.Authorization = `Bearer ${this.authorizationToken}`;
    }

    return { ...headers, ...overwrites };
  }
  /**
   * Makes a `PATCH` request.
   * @param {String}       url          The request URL.
   * @param {Object}       body         The request body.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  patch(url, body, options = {}) {
    return this.post(url, body, { method: 'patch', ...options });
  }
  /**
   * Makes a `POST` request.
   * @param {String}       url          The request URL.
   * @param {Object}       body         The request body.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  post(url, body, options = {}) {
    return this.fetch({
      url,
      body,
      method: 'post',
      ...options,
    });
  }
  /**
   * Makes a `PUT` request.
   * @param {String}       url          The request URL.
   * @param {Object}       body         The request body.
   * @param {FetchOptions} [options={}] The request options.
   * @return {Promise<Object,Error>}
   */
  put(url, body, options = {}) {
    return this.post(url, body, { method: 'put', ...options });
  }
  /**
   * Sets a bearer token for all the requests.
   * @param {String} [token=''] The new authorization token. If the value is empty, it will remove
   *                            any token previously saved.
   */
  setAuthorizationToken(token = '') {
    this.authorizationToken = token;
  }
  /**
   * Sets the default headers for the requests.
   * @param {Object}  [headers={}]     The new default headers.
   * @param {Boolean} [overwrite=true] If `false`, it will merge the new default headers with
   *                                   the current ones.
   */
  setDefaultHeaders(headers = {}, overwrite = true) {
    this.defaultHeaders = {
      ...(overwrite ? {} : this.defaultHeaders),
      ...headers,
    };
  }
}

module.exports = APIClient;
