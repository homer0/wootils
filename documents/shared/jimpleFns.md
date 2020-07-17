# Jimple Functions

A set of utility functions to generate resources that can be used on [Jimple](https://github.com/fjorgemota/jimple) or abstractions created from it (like [Jimpex](https://yarnpkg.com/package/jimpex)).

## Resources and Providers

These are the base entities sent to the container; in the case of Jimple, there's only provider, to configure something that gets added to the contianer, but on the case of Jimpex, you have controllers and middlewares.

These resources have a very simple structure: an object with a function property the container will call when processing it.

For example, the Jimple provider:

```js
const myProvider = {
  register(app) {
    // ...
  }
}
```

Then, you send that to the container and the `register` function gets called with a reference to the container itself.

> Jimpex's middlewares are controller are the same, but the function is called `connect`.

Instead of defining an object, we can use the `resource` function:

```js
const { resource } = require('wootils/shared');

const myProvider = resource('provider', 'register', (app) => {
  // ...
});
```

But if you had to be that verbose, it wouldn't make sense to make these wrappers, so the idea is for the abstractions to create their own resources to just send the function.

Since I use Jimple **everywhere**, I already added the `provider` wrapper in here:

```js
const { provider } = require('wootils/shared');

const myProvider = provider((app) => {
  // ...
});
```

> Yes, Jimple already supports the `provider` shorthand function (I made the PR for that), but once you see the rest of the wrappers, you'll understand why I redefined it in here.

As an extra, on Jimpex, I use it define the following wrappers:

```js
const { resource } = require('wootils/shared');

const controller = (connectFn) => resource('controller', 'connect', connectFn);
const middleware = (connectFn) => resource('middleware', 'connect', connectFn);
```

## Resources creators and providers creators

Let's say you want you resource to be able to take custom options to change its behaviour, for example:

```js
const { provider } = require('wootils/shared');

const myProvider = (options = {}) => provider((app) => {
  // ...
});
```

The problem there is that your provider is not longer a provider, but some sort of "provider generator", as you **have** to run the function in order to get the provider:

```js
app.register(myProvider());
```

The alternative would be to define two providers:

```js
const { provider } = require('wootils/shared');

const myProviderWithOptions = (options = {}) => provider((app) => {
  // ...
});

const myProvider = myProviderWithOptions();
```

But now, whoever implements it needs to be aware that there are two different providers for the same resource.

Here's where a `resourceCreator` comes in: this wrapper allows you to wrap a function that returns a function to interact with the resource. Let's see an example with a "provider creator":

```js
const { resourceCreator } = require('wootils/shared');

const myProvider = resourceCreator(
  'provider',
  'register',
  (options = {}) => (app) => {
    // ...
  },
);
```

The _magic_ here is that what you get in return is not a actual provider, but a {@link Proxy}. If the proxy `register` function gets called, it will internally call the "creator function" without parameters; at the same time, you can call the proxy as a function and it will be the same as calling the "creator function", it will return the provider for you to use:

```js
app.register(myProvider);
// or
app.register(myProvider({ enabled: true }));
```

Moving back to Jimple, yes, the `providerCreator` comes by default:

```js
const { providerCreator } = require('wootils/shared');

const myProvider = providerCreator((options = {}) => (app) => {
  // ...
});
```

## Collections

Finally, what if we want to group some resources together so the container can interact with all of them at once? That's what resources collections are:

```js
const { provider, resourcesCollection } = require('wootils/shared');

const myFirstProvider = provider((app) => { /* .. */ });
const mySecondProvider = provider((app) => { /* .. */ });

const myProviders = resourcesCollection('providers', 'register')({
  myFirstProvider,
  mySecondProvider,
});
```

The syntax is a little bit different from the others as it's not strictly a wrapper, it generates a function that you have to later call with a dictionary of resources.

The collection can be used to interact with all the resources at once, just by calling its function (`register` in the example), which will take care of calling the function on all its resources with the same arguments it received.

```js
app.register(myProviders);
```

It would be the same as...

```js
app.register(myFirstProvider);
app.register(mySecondProvider);
```

You can even access the resources by their keys:

```js
app.register(myProviders.myFirstProvider);
```

And yes, there's a default collection for providers already in the module, `providers`:

```js
const { provider, providers } = require('wootils/shared');

const myFirstProvider = provider((app) => { /* .. */ });
const mySecondProvider = provider((app) => { /* .. */ });

const myProviders = providers({
  myFirstProvider,
  mySecondProvider,
});
```
## ES Modules

If you are using ESM, you can import the functions from the `/esm` sub path:

```js
import {
  resource,
  resourceCreator,
  resourcesCollection,
  provider,
  providerCreator,
  providers,
} from 'wootils/esm/shared/jimpleFns';

// or

import {
  resource,
  resourceCreator,
  resourcesCollection,
  provider,
  providerCreator,
  providers,
} from 'wootils/esm/shared';
```

## Technical documentation

- {@link module:shared/jimpleFns~resource|resource}
- {@link module:shared/jimpleFns~resourceCreator|resourceCreator}
- {@link module:shared/jimpleFns~resourcesCollection|resourcesCollection}
- {@link module:shared/jimpleFns~provider|provider}
- {@link module:shared/jimpleFns~providerCreator|providerCreator}
- {@link module:shared/jimpleFns~providers|providers}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
