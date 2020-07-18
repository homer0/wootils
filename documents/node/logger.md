# Logger

The name leaves nothing to the imagination. As you may have guessed, this is service for logging messages into the console.

It's not uncommon for Node apps to be logging information into the console all the time: success messages, warnings and even errors; and if you don't have an already implemented solution for logging, you are probably calling `console.[log|info|error]` on a bunch of places, which is probably not a great thing to do.

`Logger` is not a super complete logging system with multiple logging levels and stuff like that, it's just a simple tool for logging colored messages on the console.

## Example

Let's say you scenarios like these:

```js
console.log('Starting the app');

if (usingExperimentalFeature()) {
  console.log('WARNING: This feature is experimental');
}

if (onDevelopment()) {
  console.log('Running on a development environment');
}

if (loadConfiguration()) {
  console.log('The configuration was successfully loaded');
}

try {
  methodThatMayThrowAnError();
} catch (error) {
  console.log('Damn it!', error);
}
```

Now, let's see how to implement the same messages with `Logger`:

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

> All of this code should be added on top of the already existing code showed above.

```js
const { Logger } = require('wootils/node');
// Create an instance
const logger = new Logger();
```

Now let's update the code:

```js
logger.log('Starting the app');
// Will log the message the same way `console.log` would.

if (usingExperimentalFeature()) {
  logger.warn('WARNING: This feature is experimental');
  // Will log a yellow message.
}

if (onDevelopment()) {
  logger.info('Running on a development environment');
  // Will log a gray message.
}

if (loadConfiguration()) {
  logger.success('The configuration was successfully loaded');
  // Will log a green message
}

try {
  methodThatMayThrowAnError();
} catch (error) {
  logger.error('Damn it!', error);
  // Will log `Damn it!` on read and the `error` stack trace information on `gray`.
}
```

Done, with that your app is now logging the messages with a color referencing the type of message.

### With Jimple

Let's setup a dummy app and register the service:

```js
// Import all the required modules
const Jimple = require('jimple');
const { logger } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the logger
app.register(logger);
```

Now let's update the code:

```js
// The imported provider is called `logger`, that's why I named the variable `log`.
const log = app.get('logger');

log.log('Starting the app');
// Will log the message the same way `console.log` would.

if (usingExperimentalFeature()) {
  log.warn('WARNING: This feature is experimental');
  // Will log a yellow message.
}

if (onDevelopment()) {
  log.info('Running on a development environment');
  // Will log a gray message.
}

if (loadConfiguration()) {
  log.success('The configuration was successfully loaded');
  // Will log a green message
}

try {
  methodThatMayThrowAnError();
} catch (error) {
  logger.error('Damn it!', error);
  // Will log `Damn it!` on read and the `error` stack trace information on `gray`.
}
```

Done, with that your app is now logging the messages with a color referencing the type of message.


## Features

### Colored messages

This was demonstrated on the example above:

1. `success(message)` will log a green message.
2. `warn(message)` will log a yellow message.
3. `error(message)` will log a red message.
4. `info(message)` will log a gray message.

But they all depend on this method: `log(message, color)`; it allows you to specify one of the colors available on the [`colors`](https://yarnpkg.com/package/colors) package.

By default, it uses the console default text color.

### Multiple messages at once

All the methods support both a single message or an `Array` of them:

```js
logger.info(['App running', 'connection detected', 'starting Skynet...']);
// This will log three gray messages.
```

You can even specify a color for each message:

```js
logger.success([
  'It works!',
  ['wait, something is happening', 'gray'],
  'Nevermind, Skynet is up and running!',
]);
// This will log the first and third message on green and the second one on gray.
```

### Prefix

When constructing the service or when registering the provider, you can specify a `prefix` that will be added to every message:

#### Without Jimple

```js
const { Logger } = require('wootils/node');
// Create an instance
const logger = new Logger('my-app');

logger.success('The instance was created!');
// This will log `[my-app] The instance was created!` on green.
```

#### With Jimple

```js
// Import all the required modules
const Jimple = require('jimple');
const { logger } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the logger
app.register(logger({
  messagesPrefix: 'my-app',
}));

app.get('logger').success('The instance was created!');
// This will log `[my-app] The instance was created!` on green.
```

### Date and Time

When constructing the service or when generating the provider, you can specify whether or not you would like to show the date and time on every message. By default, it only does it for errors:

#### Without Jimple

```js
const { Logger } = require('wootils/node');
// Create an instance
const logger = new Logger('my-app', true);

logger.success('The instance was created!');
// This will log `[my-app][YYYY-MM-DD HH:MM:SS] The instance was created!` on green.
```

#### With Jimple

```js
// Import all the required modules
const Jimple = require('jimple');
const { logger } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the logger
app.register(logger({
  messagesPrefix: 'my-app',
  showTime: true,
}));

app.get('logger').success('The instance was created!');
// This will log `[my-app][YYYY-MM-DD HH:MM:SS] The instance was created!` on green.
```

### appLogger

This is only for Jimple implementations. `appLogger` is a service provider that uses the service `packageInfo` to obtain the app name from the `package.json` and automatically use it as the `prefix` for every message.

Let's say the `name` of your app on your `package.json` is `skynet`:

```js
// Import all the required modules
const Jimple = require('jimple');
const { appLogger } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the logger
app.register(appLogger);

app.get('appLogger').success('The instance was created!');
// This will log `[skynet] The instance was created!` on green.
```

`appLogger` can also be used as a function, like `logger`, so you can send an options object to enable the `showTime`.

## ES Modules

If you are using ESM, you can import the class and the providers from the `/esm` sub path:

```js
import {
  Logger,
  logger,
  appLogger,
} from 'wootils/esm/node/logger';

// just the class

import { Logger } from 'wootils/esm/node';

// just the providers

import {
  logger,
  appLogger,
} from 'wootils/esm/node/providers';
```

## Technical documentation

- Module: {@link module:node/logger|node/logger}
- Class: {@link Logger}
- Provider: {@link module:node/logger~logger|logger}
- Provider with app name as prefix: {@link module:node/logger~appLogger|appLogger}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
