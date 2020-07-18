# ErrorHandler

Listens for uncaught exceptions and unhandled promises rejections, and logs them out with full detail.

By default, if an error is thrown, node will just output the error, but if a `Promise` is rejected and there's no `catch` to capture the exception, it will log `...`, which doesn't provide a lot of information, right?

Well, `ErrorHandler` listens for these kind of exceptions, unhandled errors and rejected promises, and logs them with their stack trace information using the `Logger` utility.

## Example

Let's say your code looks something like this:

```js
makeAnAPICall()
.then((response) => console.log(response));
```

If the request returned a `401`, Node would output something like this:

```bash
(node:34097) UnhandledPromiseRejectionWarning: Unhandled promise rejection (rejection id: 2): 401
```

Now, let's see how to get more information with `ErrorHandler`:

> The service depends on a `Logger` service instance, so you need to register it first.

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

> All of this code should be added on top of the already existing code showed above.

```js
const { Logger, ErrorHandler } = require('wootils/node');
// Create an instance of the logger service
const logger = new Logger();
// Create an instance of the handler
const errorHandler = new ErrorHandler(logger);
```

Now, once you have the instance, you have to tell it to start listening for unhandled errors:

```js
errorHandler.listen();
```

Done! If you run the same code now, this is the kind of logged information you'll get:

```bash
[2018-01-22 04:19:12] 401
at makeAPICall (/path-to-your-app/index.js:9:42)
at Object.<anonymous> (/path-to-your-app/index.js:11:1)
at Module._compile (module.js:570:32)
at Object.Module._extensions..js (module.js:579:10)
at Module.load (module.js:487:32)
at tryModuleLoad (module.js:446:12)
at Function.Module._load (module.js:438:3)
at Module.runMain (module.js:604:10)
at run (bootstrap_node.js:383:7)
at startup (bootstrap_node.js:149:9)
```

You get the date and time when it happened and the full stack trace of the error.

### With Jimple

> It uses `logger` by default, but if the service is not available, it will try to fallback to `appLogger`, the version of `logger` that prefixes all the messages with the package name.

```js
// Import all the required modules
const Jimple = require('jimple');
const {
  logger,
  errorHandler,
} = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the logger
app.register(logger);
// Register the ErrorHandler
app.register(errorHandler);
```

You could also configure it so it would exit the process when an error is caught:

```js
app.register(errorHandler({
  exitOnError: true,
}));
```

> `errorHandler` is a "provider crator", so it can be used as both, a function that generates a provider, and as provider.

Now, we should tell the service to start listening for errors:

```js
app.get('errorHandler').listen();
```

Done! If you run the same code now, this is the kind of logged information you'll get:

```bash
[my-app] [2018-01-22 04:29:40] 401
[my-app] at makeAPICall (/path-to-your-app/index.js:9:42)
[my-app] at Object.<anonymous> (/path-to-your-app/index.js:11:1)
[my-app] at Module._compile (module.js:570:32)
[my-app] at Object.Module._extensions..js (module.js:579:10)
[my-app] at Module.load (module.js:487:32)
[my-app] at tryModuleLoad (module.js:446:12)
[my-app] at Function.Module._load (module.js:438:3)
[my-app] at Module.runMain (module.js:604:10)
[my-app] at run (bootstrap_node.js:383:7)
[my-app] at startup (bootstrap_node.js:149:9)
```

## ES Modules

If you are using ESM, you can import the class and the provider from the `/esm` sub path:

```js
import {
  ErrorHandler,
  errorHandler,
} from 'wootils/esm/node/errorHandler';

// just the class

import { ErrorHandler } from 'wootils/esm/node';

// just the provider and/or the generator

import { errorHandler } from 'wootils/esm/node/providers';
```

## Technical documentation

- Module: {@link module:node/errorHandler|node/errorHandler}
- Class: {@link ErrorHandler}
- Provider: {@link module:node/errorHandler~errorHandler|errorHandler}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
