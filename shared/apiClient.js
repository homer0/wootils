const statuses = require('statuses');
const urijs = require('urijs');

class APIClient {
  constructor(url, endpoints, fetchClient, defaultHeaders = {}) {
    this.url = url;
    this.endpoints = this.flattenEndpoints(endpoints);
    this.fetchClient = fetchClient;
    this.defaultHeaders = defaultHeaders;
    this.authorizationToken = '';
  }

  flattenEndpoints(endpoints, parent = '') {
    const parentKey = parent ? `${parent}.` : '';
    let result = {};
    Object.keys(endpoints).forEach((name) => {
      const value = endpoints[name];
      const key = `${parentKey}${name}`;
      if (typeof value === 'string' || value.path) {
        result[key] = value;
      } else {
        result = Object.assign({}, result, this.flattenEndpoints(value, key));
      }
    });

    return result;
  }

  setAuthorizationToken(token = '') {
    this.authorizationToken = token;
  }

  setDefaultHeaders(headers = {}, overwrite = true) {
    this.defaultHeaders = Object.assign(
      {},
      (overwrite ? {} : this.defaultHeaders),
      headers
    );
  }

  get(url, options = {}) {
    return this.fetch(Object.assign({ url }, options));
  }

  post(url, body, options = {}) {
    return this.fetch(Object.assign({
      url,
      body,
      method: 'post',
    }, options));
  }

  put(url, body, options = {}) {
    return this.post(url, body, Object.assign({}, options, { method: 'put' }));
  }

  delete(url, body = {}, options = {}) {
    return this.post(url, body, Object.assign({}, options, { method: 'delete' }));
  }

  endpoint(name, parameters = {}) {
    const info = this.endpoints[name];
    if (!info) {
      throw new Error(`Trying to request unknown endpoint: ${name}`);
    }

    const params = Object.assign({}, parameters);
    const endpoint = typeof info === 'string' ? { path: info } : info;
    const query = {};

    if (endpoint.query) {
      Object.keys(endpoint.query).forEach((queryName) => {
        const queryValue = endpoint.query[queryName];
        if (typeof params[queryName] !== 'undefined') {
          query[queryName] = params[queryName];
          delete params[queryName];
        } else if (queryValue !== null) {
          query[queryName] = queryValue;
        }
      });
    }

    let { path } = endpoint;
    Object.keys(params).forEach((parameter) => {
      const placeholder = `:${parameter}`;
      const value = params[parameter];
      if (path.includes(placeholder)) {
        path = path.replace(placeholder, value);
      } else {
        query[parameter] = value;
      }
    });

    const uri = urijs(`${this.url}/${path}`);
    Object.keys(query).forEach((queryName) => {
      uri.addQuery(queryName, query[queryName]);
    });

    return uri.toString();
  }

  headers(overwrites = {}) {
    const headers = Object.assign({}, this.defaultHeaders);
    if (this.authorizationToken) {
      headers.Authorization = `Bearer ${this.authorizationToken}`;
    }

    return Object.assign({}, headers, overwrites);
  }

  fetch(options) {
    const opts = Object.assign({}, options);
    opts.method = opts.method ? opts.method.toUpperCase() : 'GET';
    const headers = this.headers(opts.headers);
    if (Object.keys(headers).length) {
      opts.headers = headers;
    }

    const { url } = opts;
    delete opts.url;

    if (opts.body) {
      opts.body = JSON.stringify(opts.body);
      if (!opts.headers) {
        opts.headers = {};
      }

      opts.headers['Content-Type'] = 'application/json';
    }

    let responseStatus;
    return this.fetchClient(url, opts)
    .then((response) => {
      responseStatus = response.status;
      return response.json ? response.json() : response;
    })
    .then((response) => (
      responseStatus >= statuses['Bad Request'] ?
        Promise.reject(this.error(response, responseStatus)) :
        response
    ));
  }

  error(response) {
    return new Error(response.error);
  }
}

module.exports = APIClient;
