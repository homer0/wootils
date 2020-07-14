# extendPromise

Extend a `Promise` by injecting custom properties using a `Proxy`. The custom properties will be available on the promise chain no matter how many `then`s, `catch`s or `finally`s are added.

## Example

> This function can be used with any kind of promises, but the example focuses on requests because, nowadays, they are the most common context for promises.

Let's say you have a function that makes a request and you want to be able to return a way to abort it at any point. You can use [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and
an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to do it, but you can't return just the promise, you need to return the controller or at least its `abort` method:

```js
const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });

  return { req, controller };
};
```

It looks good, but if the function is called from a service or somewhere that is not the actual implementation, you'll need to keep track of both the `Promise` and the `controller`.

You could _monkey patch_ the `abort` method to the `Promise`:

```js
const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });
  req.abort = controller.abort.bind(this);
  return req;
};
```

But there's a problem: the moment a `.then`/`.catch`/`.finally` is added to that `Promise`, a new one is generated, and the patch goes away.

This is where `extendPromise` can help you. Either the `controller` or the `abort` method can be added to the chain and the customization will be available no matter how many `.then`s are added:

```js
const { extendPromise } = require('wootils/shared');

const makeTheRequest = () => {
  const controller = new AbortController();
  const req = fetch('https://...', {
    signal: controller.signal,
  });

  return extendPromise(req, {
    abort: controller.abort.bind(this),
  });
};
```

And there you go! You can now receive the request `Promise` and abort it if needed:

```js
// Make the request
const req = makeTheRequest()
.then((response) => response.json())
.catch((error) => {
  if (error.name === 'AbortError') {
    console.log('to late...');
  }
  ...
});

// Abort it if takes more than one second.
setTimeout(() => req.abort(), 1000);
```

## Technical documentation

- Function: {@link module:shared/extendPromise~extendPromise|extendPromise}
- Helper class: {@link PromiseExtender}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
