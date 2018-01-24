# PathUtils

An easy way to manage locations and build paths relative to those locations on a Node app.

When writing static `require` statements is easy: The file you are requiring is relative to the one where you are writing the `require`. But when you are reading files or doing `require` with dynamic paths, it can get messy pretty fast, and that's where this utility shines.

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

There's a lot of ways to check whether you need to call `../config` or `../../config`: `TryCatch`, check some environment variable, check if `../config` exists, etc. Well, with `PathUtils`, you don't need to do that, because the service knowns that if you ask for `config/development.js`, it's relative to your project root directory.

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

```js
// Require the class.
const { PathUtils } = require('wootils/node');
// Instantiate it.
const pathUtils = new PathUtils();
```

Now that you have the service instance, getting the path is easy as:

```js
const devConfigPath = pathUtils.join('config/development');
```

Done, now you can use either `require` or `fs` to get the contents of the file.

### With Jimple

```js
// Import all the required modules
const Jimple = require('jimple');
const { pathUtils } = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the service
app.register(pathUtils);
```

Now that you have the service instance, getting the path is easy as:

```js
const devConfigPath = app.get('pathUtils').join('config/development');
```

Done, now you can use either `require` or `fs` to get the contents of the file.

## Features

### Build paths relative to the project root directory

This was demonstrated on the example above. The `join` method works exactly like `path.join`, you can send any number of parameters and they will be merged on one single path.

```js
pathUtils.join('config', 'development.js');
// is the same as
pathUtils.join('config/development.js');
```

### Multiple locations

By default, `PathUtils` uses the `home` location, which is the project root directory, but it also has an `app` location and the ability to register new locations:

The `app` location is the directory where your app executable file is located, for the project tree used on the example above, the `app` location is `/app` on development, and `/dist/app` when builded/deployed.

To register new locations, you use the `addLocation` method:

```js
pathUtils.addLocation('my-location', 'some-folder/some-sub-folder');
```

The new location path **must** be relative to your project root directory.

And finally, to use those locations, you use `joinFrom` instead of `join`:

```js
const pathToFile = pathUtils.joinFrom('my-location', 'some-file.js');
```

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://homer0.github.io/wootils/class/wootils/node/pathUtils.js~PathUtils.html) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```