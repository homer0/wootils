# AppConfiguration

This is a service to manage applications configurations. It takes care of loading, activating, switching and merging configuration files.

Managing configurations is always a pain on any kind of app, so the idea of this service is to just give it the minimal required information and it will take care of the rest.

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

And you execute your app with something like

```bash
node app
```

If you don't have anything managing the configurations, you would probably have something like this:

```js
const config = process.NODE_ENV === 'production' ?
  require('../config/production') :
  require('../config/development');
```

Maybe is different, but the point is that you may be checking the `NODE_ENV` to decide what to `require`.

Let's implement the same scenario with `AppConfiguration`:

> The service depends on `EnvironmentUtils` and `RootRequire` (which requires `PathUtils`) so you need to register them first.

### Without Jimple

> If you haven't tried [Jimple](https://github.com/fjorgemota/jimple), give it a try, it's excellent for organizing your app dependencies and services.

Since Jimple solves the construction of the dependencies, this will be more of a _manual process_:

```js
const {
  AppConfiguration,
  EnvironmentUtils,
  PathUtils,
  rootRequire,
} = require('wootils/node');

// Let's start with `EnvironmentUtils`, which is used to read the env variables.
const environmentUtils = new EnvironmentUtils();
// Now `PathUtils`, to build paths relative to the project root directory.
const pathUtils = new PathUtils();
// `rootRequire` for making `require`s relatives to the root directory.
const rootReq = rootRequire(pathUtils);
```

With all the needed services ready, let's construct the `AppConfiguration`:

```js
const appConfiguration = new AppConfiguration(
  environmentUtils,
  rootReq,
  'myApp',
  {},
  {
    environmentVariable: 'CONFIG',
    path: './config/',
    filenameFormat: '[name].js',
  },
);
```

Done, we first sent the required services and then set the custom options we needed:

1. `myApp` is the name of the app, the service uses it on the default `path` and `filenameFormat` options, but in this case, we don't really need it for this scenario.
2. `{}` That's the default configuration all the others will _'extend'_, in this case is not needed.
3. The options:
 - `environmentVariable`: The name of the variable the service will check to determine which configuration to use.
 - `path`: The location of your configuration files.
 - `filenameFormat`: The name format your files use. `[name]` will be replaced with the name of the configuration you want to use.

Now, there's only one thing to do:

```js
appConfiguration.loadFromEnvironment();
```

With that, `AppConfiguration` will check the environment variable and load the configuration you require.

```bash
# Load the development configuration
CONFIG=development node app

# Load the production configuration
CONFIG=production node app
```

### With Jimple

Let's create a dummy app and register the dependencies:

```js
// Import all the required modules
const Jimple = require('jimple');
const {
  environmentUtils,
  rootRequire,
  pathUtils,
  appConfiguration,
} = require('wootils/node/providers');
// Create a dummy app
const app = new Jimple();
// Register the necessary services
app.register(environmentUtils);
app.register(rootRequire);
app.register(pathUtils);
```
Now, to generate the `appConfiguration` service with the required settings to work with the scenario described above:

```js
const myConfiguration = appConfiguration(
  'myApp',
  {},
  {
    environmentVariable: 'CONFIG',
    path: './config/',
    filenameFormat: '[name].js',
  },
);
app.register(myConfiguration);
```

Done, the service is registered in the container. Let's explain a little bit why _'those'_ parameters:

1. `myApp` is the name of the app, the service uses it on the default `path` and `filenameFormat` options, but in this case, we don't really need it for this scenario.
2. `{}` That's the default configuration all the others will _'extend'_, in this case is not needed.
3. The options:
 - `environmentVariable`: The name of the variable the service will check to determine which configuration to use.
 - `path`: The location of your configuration files.
 - `filenameFormat`: The name format your files use. `[name]` will be replaced with the name of the configuration you want to use.

Now, there's only one thing to do:

```js
app.get('appConfiguration').loadFromEnvironment();
```

With that, `AppConfiguration` will check the environment variable and load the configuration you require.

```bash
# Load the development configuration
CONFIG=development node app

# Load the production configuration
CONFIG=production node app
```

## Features

### Loading configurations dynamically

This was demonstrated on the example above. Instead of you having to manually check and indicate which file to `require`, `AppConfiguration` will handle the environment variable and the `require`, so once you do `loadFromEnvironment()` you get the configuration you need.

### Using it without environment variables.

This is not the most common case of use, but `AppConfiguration` allows you to manually load new configurations from an object or from a file:

```js
...
appConfiguration.load('my-new-config', { valueOne: 'one' });
```

or

```js
appConfiguration.loadFromFile('my-new-config');
// And if you used the options from the example, it will load `/config/my-new-config.js`,
// or at least try :P.
```

The idea of these methods is that if you don't want to relay on environment variables, you can build your own logic for loading and activating configurations.

### Extending configurations

By default, all the configurations extend from the default one you sent on the constructor, but you can set an `extend` key on your configurations with the name of the one you want to extend and the service will take care of looking for that configuration and making the new one extend from there.

If you are using `loadFromEnvironment()` or `loadFromFile()` and the configuration to extend is not registered in the service, it will try to load the file; but if you are using `load()`, the configuration needs to be registered or it will throw an error. It doesn't sound nice, but the point is to make clear that you are either working with files or with manual configurations.

### Get and Set

Your configuration is not longer a literal object and the service provides a couple of methods to make your life easy when reading or writing settings:

#### Reading

```js
// Read a single setting
const value = appConfiguration.get('something');
// Reading multiple settings
const { valueOne, valueTwo } = appConfiguration.get(['valueOne', 'valueTwo']);
```

#### Writing

> The changes won't affect a configuration file, they'll only affect the configuration loaded on the service.

```js
// Writing a single setting
appConfiguration.set('something', 'value');
// Write multiple settings
appConfiguration.write({
  valueOne: 'one',
  valueTwo: 'two',
});
```

Another cool thing it does is when it writes a setting, if both the current and the new values are both Objects, it will merge them:

```js
appConfiguration.set('person', {
  name: 'Rosario',
  birthday: '',
});
appConfiguration.set('person', {
  birthday: '25-09-2015',
});
console.log(appConfiguration.get('person'));
/**
 * Will output:
 * {
 *   name: 'Rosario',
 *   birthday: '25-09-2015',
 * }
 */
```

### Switching configurations while the app is running

There's a special rule behind this feature: The default configuration and/or the first configuration loaded needs to have a key name `allowConfigurationSwitch` set to `true` in order switch configurations. The reason of this rule is **security**: If you deployed to production and the you didn't turn off whatever you have that makes the service switch configurations, other people can use it. This way, you can have this enabled only on specifics configuration and disabled on others.

## Technical documentation

- Class: {@link AppConfiguration}
- Provider generator: {@link module:node/appConfiguration~appConfiguration|appConfiguration}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
