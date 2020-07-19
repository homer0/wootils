# EnvironmentUtils

A really small service to centralize the place where you read and write environment variables, and check if you are running on development or production.

Is not uncommon nowadays for Node apps to be checking `NODE_ENV` and other environment variables in order to do or not to do certain things, and having multiple calls to `process.env` on different places of your app may not be a good idea: It's hard to track and maintain.

## Examples

### Read

Let's say your code looks something like this:

```js
if (process.env.NODE_ENV !== 'production') {
  addSomeStuffForDevelopment();
}

console.log(`Hello ${process.env.NAME}`);
```

Let's implement the same but with `EnvironmentUtils`:

#### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

```js
const { EnvironmentUtils } = require('wootils/node');
// Construct an instance.
const environmentUtils = new EnvironmentUtils();
```

Now, to update the code:

```js
if (environmentUtils.development) {
  addSomeStuffForDevelopment();
}
// The service allows you to set a default in case the variable is not defined.
const name = environmentUtils.get('NAME', 'Rosario');
console.log(`Hello ${name}`);
```

Done! Now you are not manually checking for `NODE_ENV` and all your variables are being read on a single place.

#### With Jimple

Let's setup a dummy app and register the service:

```js
// Import all the required modules
const Jimple = require('jimple');
const { environmentUtils } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();

app.register(environmentUtils);
```
Now, to update the code:

```js
// The imported provider has the same name, that's why I called it `envUtils`.
const envUtils = app.get('environmentUtils');
if (envUtils.development()) {
  addSomeStuffForDevelopment();
}
// The service allows you to set a default in case the variable is not defined.
const name = envUtils.get('NAME', 'Rosario');
console.log(`Hello ${name}`);
```

Done! Now you are not manually checking for `NODE_ENV` and all your variables are being read on a single place.

### Write

Ok, writing on the environment from inside an application is not that common as reading, but there are certain cases where this may come in handy.

Let's say you are using a library that has a _"debug mode"_ but the only way to enable it is using a environment variable, and for "purposes of debugging", you want to do it from your code:

```js
process.env.DEBUG_MY_LIBRARY = 'true';
runMyMagicLibrary();
```

Like for `get`, `set` also allows you to centralize where you overwrite your environment variables, but at the same time, it protects you from overwriting something that is already declared: Unless you tell `set` to overwrite declarations, if the variable already exists, it won't do it.

#### Without Jimple

Let's start with the setup:

```js
const { EnvironmentUtils } = require('wootils/node');
// Construct an instance.
const environmentUtils = new EnvironmentUtils();
```

Now, to update the code:

```js
// If you add a third parameter with `true`, it will overwrite any previous declaration.
const name = environmentUtils.set('DEBUG_MY_LIBRARY', 'true');
runMyMagicLibrary();
```

Done! Now you are not manually updating the environment variable and potentially overwriting something that was already declared.

#### With Jimple

Let's setup a dummy app and register the service:

```js
// Import all the required modules
const Jimple = require('jimple');
const { environmentUtils } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();

app.register(environmentUtils);
```
Now, to update the code:

```js
// The imported provider has the same name, that's why I called it `envUtils`.
const envUtils = app.get('environmentUtils');
// If you add a third parameter with `true`, it will overwrite any previous declaration.
const name = envUtils.set('DEBUG_MY_LIBRARY', 'true');
runMyMagicLibrary();
```

Done! Now you are not manually updating the environment variable and potentially overwriting something that was already declared.

## Features

### Reading variables

This was demonstrated on the first example. You just need to `.get()` with the name of the variable you want to read.

### Writing variables

This was demostrated on the second example. You just need to `.set()` with the name and the value for the variable.

### Validating variables

You can call `.exists()` with the name of the variable and the service will tell you if it's defined on the environment.

### Environment type validation

No more `if (process.env.NODE_ENV ...`, `EnvironmentUtils` does it once when you instantiate it and then gives you `production()` and `development()` for you to use.

## ES Modules

If you are using ESM, you can import the class and the provider from the `/esm` sub path:

```js
import {
  EnvironmentUtils,
  environmentUtils,
} from 'wootils/esm/node/environmentUtils';

// just the class

import { EnvironmentUtils } from 'wootils/esm/node';

// just the provider

import { environmentUtils } from 'wootils/esm/node/providers';
```

## Technical documentation

- Module: {@link module:node/environmentUtils|node/environmentUtils}
- Class: {@link EnvironmentUtils}
- Provider: {@link module:node/environmentUtils~environmentUtils|environmentUtils}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
