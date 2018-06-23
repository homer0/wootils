# APIClient

A really basic client to work with an API endpoints requests.

Nowadays there's almost no app that doesn't make requests to one or more external APIs, that's why I built this service.

Now, the reason this is marked as _'shared'_ it's because it basically organizes the API configuration and prepares the requests, but you have to give it a `fetch` client to make the request. It's _'shared'_ because on a browser you can give it the native `fetch` function, and on Node, something like `node-fetch` or `axios`, but that supports the native `fetch` signature.

## Examples

> This example will be on Node, so I'll use [`node-fetch`](https://yarnpkg.com/en/package/node-fetch) as fetch client.

First, let's start by creating the configuration:

```js
const url = 'https://my-api.com';
const endpoints: {
  login: 'auth/login',
  profile: 'users/:userId',
  users: 'users',
};
const fetchClient = require('node-fetch');
```

You need those three things to instantiate the client:

1. An entry point for your API.
2. A dictionary of endpoints (Check the **features** section to see all the possible ways to define an endpoint).
3. A fetch client to make the requests.

Now, to instantiate the client:

```js
const { APIClient } = require('wootils/shared');

const client = new APIClient(url, endpoints, fetchClient);
```

To make a request, you first need to generate an endpoint and use it to call the method of the type of request you want to make.

Let's say you want to authenticate a user, which is a `POST` request to the `login` endpoint with a body that includes `username` and `password`:

```js
client.post(client.endpoint('login'), {
  username: 'Rosario',
  password: 'charito',
})
.then((response) => {
  // Do something...
});
```

Ok, that one was easy, no extra options or parameters. Next will request some user information from the `profile` endpoint, a `GET` request that requires a `userId` parameter:

```js
client.get(client.endpoint('profile', { userId: 2509 }), {
  username: 'Rosario',
  password: 'charito',
})
.then((response) => {
  // Do something...
});
```

Easy enough, right? Well, for the last example, we'll make a request to get the users directory to the `users` endpoint, a `GET` request and we'll include a query string parameter to _"limit the number of returned users"_:

```js
client.get(client.endpoint('users', { count: 10 }), {
  username: 'Rosario',
  password: 'charito',
})
.then((response) => {
  // Do something...
});
```

Done! If the parameter doesn't have a placeholder on the endpoint path, it gets automatically added on the query string.

## Features

### Configurable endpoints

On the example above, all the endpoints were strings, but you can define them as objects to include default query string parameters, or even as sub collections of endpoints:

#### Endpoint objects

```js
const endpoints = {
  users: {
    path: 'users',
    query: {
      count: 10,
      offset: null,
    },
  },
};
```

In that case, if `count` is not specified on `endpoint(...)`, it will have a default value of `10`.

And if `offset` is not specified, it won't be sent. The reason the configuration supports _"nullable"_ parameters is so they can be used like some sort of documentation for the endpoint: _"It's not used, but there's an optional parameter called ..."_.

#### Sub collections of endpoints

```js
const endpoints = {
  login: 'auth/login',
  users: {
    profile: 'users/:userId',
    directory: {
      path: 'users',
      query: {
        count: 10,
      },
    },
  },
};
```

As you can see, both users related endpoints are now under `users`, and `login` is still on the top level. To access _"sub endpoints"_ you use dot notation:

```js
const endpointURL = client.endpoint('users.profile', { userId: 2509 });
```

This allows you to organize the scopes of your endpoints and make the configuration easier to read.

#### Built-in request methods

On the example above we saw only `.get` and `.post`, but the client comes with these already built-in request methods:

- `.get(url, options = {})`
- `.post(url, body, options = {})`
- `.put(url, body, options = {})`
- `.patch(url, body, options = {})`
- `.delete(url, body = {}, options = {})`

If you are wondering what `options` are, well, they are extra options for the `fetch` client call. It can include headers, another method, another body, etc. Everything that could send on the `fetch` call second parameter.

#### Default headers

The client allows you to set a dictionary of default headers you want to include on every request.

For example, let's say you are on a development environment and you want all your request to go out with the header `x-development` set to `true`:

```js
client.setDefaultHeaders({
  'x-development': true,
});
```

Now, all the outgoing requests will include that header.

#### Authorization token

If you are working with an API that requires authorization on every requests, and that provides you with a bearer token when you authenticate, you could set it on the client and it will automatically include the `Authorization` header on every request and send the token:

```js
client.setAuthorizationToken('some-token');
```

Done, all the requests will include `Authorization: Bearer some-token`.

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://homer0.github.io/wootils/class/wootils/shared/apiClient.js~APIClient.html) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```
