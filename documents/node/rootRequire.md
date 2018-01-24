# rootRequire

Is basically `require` but the path is relative to the project root directory.

This is very useful when working with dynamic `require` statements and project that when bundled or deployed change locations.

## Example

Let's say your app tree looks like this:

```
myApp/
├── config/
│   ├── development.js
│   └── production.js
└── app/
    └── index.js
```

And you want to access `config/development.js`, but when you build your app, or prepare it to deployment, it becomes this:

```
myApp/
├── dist/
│   └── app/
│       └── index.min.js
├── config/
│   ├── development.js
│   └── production.js
└── app/
    └── index.js
```

There's a lot of ways to check whether you need to call `../config` or `../../config`: `TryCatch`, check some environment variable, check if `../config` exists, etc.  Well, with `rootRequire`, you don't need to do that, because the service knowns that if you ask for `config/development.js`, it's relative to your project root directory.

Now, before taking a look a how we would implement this with root require, the function, even as small as it is, it has a dependency: `PathUtils`. It uses it to build the paths relative to the project root directory.

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Let's start with the setup:

```js
const { PathUtils, rootRequire } = require('wootils/node');
// Create an instance of the dependency.
const pathUtils = new PathUtils();

// Now, let's generate the function
const rootReq = rootRequire(pathUtils);
// And finally use it to get the file
const config = rootReq('config/development');
```

Done, `config` now has the contents of `config/development`, and this will work no matter where the app file is located.

### With Jimple

First, let's setup a dummy app and register the dependency and the service itself:

```js
// Import all the required modules
const Jimple = require('jimple');
const { pathUtils, rootRequire } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the dependency
app.register(pathUtils);
// Register the service
app.register(rootRequire);
```

Now, to use it:

```js
const config = app.get('rootRequire')('config/development');
```

Done, `config` now has the contents of `config/development`, and this will work no matter where the app file is located.

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://homer0.github.io/wootils/function/index.html#static-function-rootRequire) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```