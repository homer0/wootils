# packageInfo

A tiny function that reads the contents of the app `package.json`. This is really useful on an Jimple application where you can register it, because the returned value gets cached and it's available as a service.

## Example

Even if the function is really small (one line to be exact), it has a dependency: `PathUtils`. It uses it to build the path to the `package.json` relative to the project root directory.

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

```js
const { PathUtils, packageInfo } = require('wootils/node');
// Create an instance of the dependency.
const pathUtils = new PathUtils();

// Now, let's use the function
const packageJson = packageInfo(pathUtils);
```

Done, `packageJson` now has all the contents of your `package.json`, as an Object.

### With Jimple

First, let's setup a dummy app and register the dependency and the service itself:

```js
// Import all the required modules
const Jimple = require('jimple');
const { pathUtils, packageInfo } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the dependency
app.register(pathUtils);
// Register the service
app.register(packageInfo);
```

Now, to use it:

```js
const packageJson = app.get('packageInfo');
```

Done, `packageJson` now has all the contents of your `package.json`, as an Object; and the file won't be read more than once.

## Technical documentation

- Function: {@link module:node/packageInfo~packageInfo|packageInfo}
- Provider: {@link module:node/packageInfo~packageInfoProvider|packageInfoProvider}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
