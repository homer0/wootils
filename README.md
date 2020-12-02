# Wootils

[![GitHub Workflow Status (master)](https://img.shields.io/github/workflow/status/homer0/wootils/Test/master?style=flat-square)](https://github.com/homer0/wootils/actions?query=workflow%3ATest)
[![Coveralls GitHub](https://img.shields.io/coveralls/github/homer0/wootils.svg?style=flat-square)](https://coveralls.io/github/homer0/wootils?branch=master)
[![David](https://img.shields.io/david/homer0/wootils.svg?style=flat-square)](https://david-dm.org/homer0/wootils)
[![David](https://img.shields.io/david/dev/homer0/wootils.svg?style=flat-square)](https://david-dm.org/homer0/wootils)

A set of Javascript utilities for building Node and browser apps.

## Motivation/Introduction

The idea was to take all those small thing I'm always rewriting on every project and move them to a single package so I can, not only stop copying & pasting them all over the place, but also maintain them all together.

There are two rules I followed when I had to decide what to put and what to keep somewhere else:

1. The utility needs to fit on a single file.
2. It shouldn't include any specific business logic from any other project.

## Usage

The package is divided on 3 folders:

- `node`: Utilities that are only compatible with Node.
- `shared`: Utilities that can work on both browser and Node.
- `browser`: Utilities that can only be used while on a browser.

### Node utilities

Two notes about the Node utilities:

1. I'm a big fan of [Jimple](https://github.com/fjorgemota/jimple), so all the files not only export the utility but also a service provider or a _"servicer provider generator"_ to register the utility on a Jimple app.
2. Some of them may depend on the others.

#### AppConfiguration

This is a service to manage applications configurations. It takes care of loading, activating, switching and merging configuration files.

[Read more about AppConfiguration](./documents/node/appConfiguration.md)

#### EnvironmentUtils

A really small service to centralize the place where you read environment variables and check if you are running on development or production.

[Read more about EnvironmentUtils](./documents/node/environmentUtils.md)

#### ErrorHandler

Listens for uncaught exceptions and unhandled promises rejections, and logs them out with full detail.

[Read more about ErrorHandler](./documents/node/errorHandler.md)

#### Logger

The name leaves nothing to the imagination. As you may have guessed, this is service for logging messages into the console.

[Read more about Logger](./documents/node/logger.md)

#### packageInfo

A tiny function that reads the contents of the app `package.json`. This is really useful on an Jimple application where you can register it, because the returned value gets cached and it's available as a service.

[Read more about packageInfo](./documents/node/packageInfo.md)

#### PathUtils

An easy way to manage locations and build paths relative to those locations on a Node app.

[Read more about PathUtils](./documents/node/pathUtils.md)

#### rootRequire

Is basically `require` but the path is relative to the project root directory.

[Read more about rootRequire](./documents/node/rootRequire.md)

### Shared utilities

#### APIClient

A really basic client to work with an API endpoints requests.

[Read more about APIClient](./documents/shared/APIClient.md)

#### DeepAssign

Deep merge (and copy) of objects(`{}`) and `Array`s using native spread syntax.

[Read more about DeepAssign](./documents/shared/deepAssign.md)

#### deferred

Create a deferred promise using the native `Promise` object.

[Read more about deferred](./documents/shared/deferred.md)

#### EventsHub

A small implementation of a pubsub service for handling events on an app.

[Read more about EventsHub](./documents/shared/eventsHub.md)

#### extendPromise

A way to extend promise chains by _injecting_ custom properties.

[Read more about extendPromise](./documents/shared/extendPromise.md)

#### Jimple Functions

A set of utility functions to generate resources that can be used on Jimple or abstractions created from it (like [Jimpex](https://yarnpkg.com/package/jimpex)).

[Read more about the Jimple Functions](./documents/shared/jimpleFns.md)

#### ObjectUtils

A small collection of utility methods to work with objects.

[Read more about ObjectUtils](./documents/shared/objectUtils.md)

### Browser utilities

#### SimpleStorage

An **abstract** class allows you to build services that relay on browser storage (session/local) and simplifies the way you work it.

[Read more about SimpleStorage](./documents/shared/simpleStorage.md)

## ES Modules

All files are written using commonjs, as I targeted the oldest Node LTS and it doesn't support modules (without a flag) yet, but you can use it with ESM.

When the package gets published, an ESM version is generated on the path `/esm`. If you are using the latest version of Node, or a module bundler (like [projext](https://projextjs.com) :D), instead of requiring from the package's root path, you should do it from the `/esm` sub path:

```js
// commonjs
const ObjectUtils = require('wootils/shared/objectUtils');

// ESM
import ObjectUtils from 'wootils/esm/shared/objectUtils';
```

Since the next LTS to become "the oldest" is 12, which still uses the flag, I still have no plans on going with ESM by default.

## Development

### NPM/Yarn Tasks

| Task       | Description                          |
|------------|--------------------------------------|
| `docs`     | Generates the project documentation. |
| `lint`     | Lints the staged files.              |
| `lint:all` | Lints the entire project code.       |
| `test`     | Runs the project unit tests.         |
| `todo`     | Lists all the pending to-do's.       |

### Repository hooks

I use [`husky`](https://yarnpkg.com/package/husky) to automatically install the repository hooks so the code will be tested and linted before any commit and the dependencies updated after every merge.

The configuration is on the `husky` property of the `package.json` and the hooks' files are on `./utils/hooks`.

#### Commits convention

I use [conventional commits](https://www.conventionalcommits.org) with [`commitizen`](https://yarnpkg.com/package/commitizen) in order to support semantic releases. The one that sets it up is actually husky, that installs a script that runs commitizen on the `git commit` command.

The hook for this is on `./utils/hooks/prepare-commit-msg` and the configuration for comitizen is on the `config.commitizen` property of the `package.json`.

### Releases

I use [`semantic-release`](https://yarnpkg.com/package/semantic-release) and a GitHub action to automatically release on NPM everything that gets merged to master.

The configuration for `semantic-release` is on `./releaserc` and the workflow for the release is on `./.github/workflow/release.yml`.

### Testing

I use [Jest](https://facebook.github.io/jest/) to test the project.

The configuration file is on `./.jestrc.json`, the tests are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Code linting and formatting

For linting, I use [ESlint](https://eslint.org) with [my own custom configuration](https://yarnpkg.com/package/@homer0/eslint-plugin); there are two configuration files, `./.eslintrc` for the source and the tooling, and `./tests/.eslintrc`, and there's also a `./.eslintignore` to exclude some files.

And for formatting, I use [Prettier](https://prettier.io) with [my JSDoc plugin](https://yarnpkg.com/package/@homer0/prettier-plugin-jsdoc) and [my own custom configuration](https://yarnpkg.com/package/@homer0/prettier-config). The configuration file is `./.prettierrc`.

The script that runs them is `./utils/scripts/lint`; the script `lint-all` only runs ESLint, and runs it for the entire project.

### Documentation

I use [JSDoc](https://jsdoc.app) to generate an HTML documentation site for the project.

The configuration file is on `./.jsdoc.js` and the script that runs it is on `./utils/scripts/docs`.

### To-Dos

I use `@todo` comments to write all the pending improvements and fixes, and [Leasot](https://yarnpkg.com/en/package/leasot) to generate a report. The script that runs it is on `./utils/scripts/todo`.

### Windows

This project uses bash scripts for development, so if you want to develop on Windows, you need to do it with [WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10).
