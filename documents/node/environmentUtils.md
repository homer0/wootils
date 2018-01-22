# EnvironmentUtils

A really small service to centralize the place where you read environment variables and check if you are running on development or production.

Is not uncommon nowadays for Node apps to be checking `NODE_ENV` and other environment variables in order to do or not to do some stuff, and having multiple calls to `process.env` on different places of your app may not be a good idea: It's hard to track and maintain.

## Example

Let's say your code looks something like this:

```js
if (process.env.NODE_ENV !== 'production') {
  addSomeStuffForDevelopment();
}

console.log(`Hello ${process.env.NAME}`);
```

Let's implement the same but with `EnvironmentUtils`:

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

```js
const { EnvironmentUtils } = require('wootils/node');
// Construct an instance.
const environmentUtils = new EnvironmentUtils();
```

Now, to update the code:

```js
if (environmentUtils.development()) {
  addSomeStuffForDevelopment();
}
// The service allows you to set a default in case the variable is not defined.
const name = environmentUtils.get('NAME', 'Rosario');
console.log(`Hello ${name}`);
```

Done! Now you are not manually checking for `NODE_ENV` and all your variables are being read on a single place.

### With Jimple

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

## Features

### Reading variables

This was demonstrated on the example above. You just need to `.get()` with the name of the variable you want to read.

### Checking the environment

No more `if (process.env.NODE_ENV ...`, `EnvironmentUtils` does it once when you instantiate it and then gives you `production()` and `development()` for you to use.

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://doc.esdoc.org/github.com/homer0/wootils/class/wootils/node/environmentUtils.js~EnvironmentUtils.html) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```