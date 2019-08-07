jest.unmock('/shared/objectUtils');
jest.unmock('/shared/apiClient');

require('jasmine-expect');
const APIClient = require('/shared/apiClient');

describe('APIClient', () => {
  it('should be instantiated with a base URL, endpoints and a fetch client', () => {
    // Given
    const url = 'http://example.com';
    const endpoints = {
      one: '/one',
      two: '/two',
    };
    const fetchClient = 'fetch';
    let sut = null;
    // When
    sut = new APIClient(url, endpoints, fetchClient);
    // Then
    expect(sut).toBeInstanceOf(APIClient);
    expect(sut.url).toBe(url);
    expect(sut.endpoints).toEqual(endpoints);
    expect(sut.fetchClient).toBe(fetchClient);
  });

  it('should be able to flatten a dictionary with nested endpoints', () => {
    // Given
    const endpoints = {
      one: 'one',
      two: {
        three: {
          path: 'two/three',
        },
        four: {
          five: 'two/four/five',
        },
        six: 'two/six',
      },
    };
    let sut = null;
    // When
    sut = new APIClient('', endpoints, () => {});
    // Then
    expect(sut.endpoints).toEqual({
      one: endpoints.one,
      'two.three': endpoints.two.three,
      'two.four.five': endpoints.two.four.five,
      'two.six': endpoints.two.six,
    });
  });

  it('should be able to set and remove an authorization token', () => {
    // Given
    const token = '25-10-2015';
    let sut = null;
    let tokenAfterSet = null;
    let tokenAfterRemove = null;
    // When
    sut = new APIClient('', {}, () => {});
    sut.setAuthorizationToken(token);
    tokenAfterSet = sut.authorizationToken;
    sut.setAuthorizationToken();
    tokenAfterRemove = sut.authorizationToken;
    // Then
    expect(tokenAfterSet).toBe(token);
    expect(tokenAfterRemove).toBeEmptyString();
  });

  it('should be able to set and remove custom base headers', () => {
    // Given
    const baseHeaders = {
      'x-date': '25-10-2015',
    };
    const extraHeaders = {
      'x-name': 'Charito',
    };
    let sut = null;
    let headersAfterFirstSet = null;
    let headersAfterSecondSet = null;
    let headersAfterSetWithOverwrite = null;
    let headersAfterRemove = null;
    // When
    sut = new APIClient('', {}, () => {});
    sut.setDefaultHeaders(baseHeaders);
    headersAfterFirstSet = Object.assign({}, sut.defaultHeaders);
    sut.setDefaultHeaders(extraHeaders, false);
    headersAfterSecondSet = Object.assign({}, sut.defaultHeaders);
    sut.setDefaultHeaders(baseHeaders);
    headersAfterSetWithOverwrite = Object.assign({}, sut.defaultHeaders);
    sut.setDefaultHeaders();
    headersAfterRemove = Object.assign({}, sut.defaultHeaders);
    // Then
    expect(headersAfterFirstSet).toEqual(baseHeaders);
    expect(headersAfterSecondSet).toEqual(Object.assign({}, baseHeaders, extraHeaders));
    expect(headersAfterSetWithOverwrite).toEqual(baseHeaders);
    expect(headersAfterRemove).toEqual({});
  });

  it('should be able to format a basic endpoint', () => {
    // Given
    const url = 'http://example.com';
    const endpoints = {
      one: 'one',
    };
    let sut = null;
    let result = null;
    // When
    sut = new APIClient(url, endpoints, () => {});
    result = sut.endpoint('one');
    // Then
    expect(result).toBe(`${url}/${endpoints.one}`);
  });

  it('should be able to format an endpoint with parameters', () => {
    // Given
    const url = 'http://example.com';
    const placeholder = 'param';
    const placeholderValue = 'hello-world';
    const endpoints = {
      one: `one/:${placeholder}`,
    };
    const expectedPath = endpoints.one.replace(`:${placeholder}`, placeholderValue);
    let sut = null;
    let result = null;
    // When
    sut = new APIClient(url, endpoints, () => {});
    result = sut.endpoint('one', { [placeholder]: placeholderValue });
    // Then
    expect(result).toBe(`${url}/${expectedPath}`);
  });

  it('should be able to format an endpoint and add a parameter as query', () => {
    // Given
    const url = 'http://example.com';
    const placeholder = 'param';
    const placeholderValue = 'hello-world';
    const endpointName = 'endpoint';
    const endpointPath = 'some/path';
    const endpoints = {
      [endpointName]: endpointPath,
    };
    let sut = null;
    let result = null;
    // When
    sut = new APIClient(url, endpoints, () => {});
    result = sut.endpoint(endpointName, { [placeholder]: placeholderValue });
    // Then
    expect(result).toBe(`${url}/${endpointPath}?${placeholder}=${placeholderValue}`);
  });

  it('should throw an error if a requested endpoint doesn\'t exist', () => {
    // Given
    const endpoint = 'some-endpoint';
    let sut = null;
    // When
    sut = new APIClient('', {}, () => {});
    // Then
    expect(() => {
      sut.endpoint(endpoint);
    }).toThrow(`Trying to request unknown endpoint: ${endpoint}`);
  });

  it('should be able to format an endpoint with parameters and query', () => {
    // Given
    const url = 'http://example.com';
    const placeholder = 'param';
    const placeholderValue = 'hello-world';
    const queryPlaceholderOne = 'q1';
    const queryPlaceholderOneValue = 'v1';
    const queryPlaceholderTwo = 'q2';
    const queryPlaceholderThree = 'q3';
    const queryPlaceholderThreeValue = 'v3';
    const endpoints = {
      one: {
        path: `one/:${placeholder}`,
        query: {
          [queryPlaceholderOne]: null,
          [queryPlaceholderTwo]: null,
          [queryPlaceholderThree]: queryPlaceholderThreeValue,
        },
      },
    };

    const expectedQuery = `?${queryPlaceholderOne}=${queryPlaceholderOneValue}` +
      `&${queryPlaceholderThree}=${queryPlaceholderThreeValue}`;
    const expectedPath = endpoints.one.path
    .replace(`:${placeholder}`, placeholderValue);
    const expectedPathWithQuery = `${expectedPath}${expectedQuery}`;
    let sut = null;
    let result = null;
    // When
    sut = new APIClient(url, endpoints, () => {});
    result = sut.endpoint('one', {
      [placeholder]: placeholderValue,
      [queryPlaceholderOne]: queryPlaceholderOneValue,
    });
    // Then
    expect(result).toBe(`${url}/${expectedPathWithQuery}`);
  });

  it('should be ble to configure the headers for a request', () => {
    // Given
    const token = '25x10x2015';
    const baseHeaders = {
      'x-date': '25-10-2015',
    };
    const extraHeaders = {
      'x-name': 'Charito',
    };
    const authorizationHeader = {
      Authorization: `Bearer ${token}`,
    };
    let sut = null;
    let headersByDefault = null;
    let headersWithOverwrites = null;
    let headersAfterAddingToken = null;
    let headersAfterAddingDefaults = null;
    let headersAfterRemovingToken = null;
    let headersAfterRemovingDefaults = null;
    // When
    sut = new APIClient('', {}, () => {});
    headersByDefault = Object.assign({}, sut.headers());
    headersWithOverwrites = Object.assign({}, sut.headers(extraHeaders));
    sut.setAuthorizationToken(token);
    headersAfterAddingToken = Object.assign({}, sut.headers(extraHeaders));
    sut.setDefaultHeaders(baseHeaders);
    headersAfterAddingDefaults = Object.assign({}, sut.headers(extraHeaders));
    sut.setAuthorizationToken();
    headersAfterRemovingToken = Object.assign({}, sut.headers(extraHeaders));
    sut.setDefaultHeaders();
    headersAfterRemovingDefaults = Object.assign({}, sut.headers(extraHeaders));
    // Then
    expect(headersByDefault).toEqual({});
    expect(headersWithOverwrites).toEqual(extraHeaders);
    expect(headersAfterAddingToken).toEqual(Object.assign({}, authorizationHeader, extraHeaders));
    expect(headersAfterAddingDefaults).toEqual(Object.assign(
      {},
      baseHeaders,
      authorizationHeader,
      extraHeaders
    ));
    expect(headersAfterRemovingToken).toEqual(Object.assign(
      {},
      baseHeaders,
      extraHeaders
    ));
    expect(headersAfterRemovingDefaults).toEqual(extraHeaders);
  });

  it('should format a response error into an object', () => {
    // Given
    const errorMessage = 'Something went terribly wrong';
    const errorResponse = {
      error: errorMessage,
    };
    let sut = null;
    let result = null;
    // When
    sut = new APIClient('', {}, () => {});
    result = sut.error(errorResponse);
    // Then
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(errorMessage);
  });

  it('should make a successfully GET request', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({ url: requestURL })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        method: 'GET',
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully GET request with a response that doesn\'t support json()', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      data: requestResponseData,
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({ url: requestURL })
    .then((response) => {
      // Then
      expect(response.data).toEqual(requestResponseData);
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully GET request without decoding the response', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponse = {
      status: 200,
      json: jest.fn(),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({ url: requestURL, json: false })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponse);
      expect(requestResponse.json).toHaveBeenCalledTimes(0);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        method: 'GET',
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully GET request without decoding an empty response', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponse = {
      status: 200,
      size: 0,
      json: jest.fn(),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({ url: requestURL })
    .then((response) => {
      // Then
      expect(response).toEqual({});
      expect(requestResponse.json).toHaveBeenCalledTimes(0);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        method: 'GET',
      });
    });
  });

  it('should make a successfully POST request', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({
      url: requestURL,
      method: requestMethod,
      body: requestBody,
    })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully POST request with custom headers', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    const requestBody = {
      prop: 'value',
    };
    const requestHeaders = {
      'x-date': '25-10-2015',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({
      url: requestURL,
      method: requestMethod,
      body: requestBody,
      headers: requestHeaders,
    })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: Object.assign(
          {},
          {
            'Content-Type': 'application/json',
          },
          requestHeaders
        ),
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a failed GET request', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      error: 'Something went terribly wrong!',
    };
    const requestResponse = {
      status: 404,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.fetch({ url: requestURL })
    .then(() => {
      throw new Error('This test should resolve on the catch');
    })
    .catch((error) => {
      // Then
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(requestResponseData.error);
    });
  });

  it('should make a successfully GET request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.get(requestURL)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        method: 'GET',
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully POST request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.post(requestURL, requestBody)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t overwrite the content type if it was already set', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    const headers = {
      'Content-Type': 'application/charito',
    };
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.post(requestURL, requestBody, { headers })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers,
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t overwrite the content type nor encode the body if is not an object', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    const requestBody = 'Hello Charito!';
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.post(requestURL, requestBody)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {},
        method: requestMethod.toUpperCase(),
        body: requestBody,
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('shouldn\'t encode the body if is not an object literal', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'post';
    class CustomFormData {}
    const requestBody = new CustomFormData();
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    const headers = {
      'Content-Type': 'application/custom-form-data',
    };
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.post(requestURL, requestBody, { headers })
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers,
        method: requestMethod.toUpperCase(),
        body: requestBody,
      });
    });
  });

  it('should make a successfully PUT request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'put';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.put(requestURL, requestBody)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully PATCH request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'patch';
    const requestBody = {
      prop: 'value',
    };
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.patch(requestURL, requestBody)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: requestMethod.toUpperCase(),
        body: JSON.stringify(requestBody),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully DELETE request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'delete';
    const requestResponseData = {
      message: 'hello-world',
    };
    const requestResponse = {
      status: 200,
      json: jest.fn(() => Promise.resolve(requestResponseData)),
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.delete(requestURL)
    .then((response) => {
      // Then
      expect(response).toEqual(requestResponseData);
      expect(requestResponse.json).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: requestMethod.toUpperCase(),
        body: JSON.stringify({}),
      });
    })
    .catch((error) => {
      throw error;
    });
  });

  it('should make a successfully HEAD request using the shortcut method', () => {
    // Given
    const requestURL = 'http://example.com';
    const requestMethod = 'head';
    const requestResponse = {
      status: 200,
    };
    const fetchClient = jest.fn(() => Promise.resolve(requestResponse));
    let sut = null;
    // When
    sut = new APIClient('', '', fetchClient);
    return sut.head(requestURL)
    .then(() => {
      // Then
      expect(fetchClient).toHaveBeenCalledTimes(1);
      expect(fetchClient).toHaveBeenCalledWith(requestURL, {
        method: requestMethod.toUpperCase(),
      });
    })
    .catch((error) => {
      throw error;
    });
  });
});
