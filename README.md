# Wootils

A set of Javascript utilities for building Node and browser apps.

## Motivation/Introduction

The idea was to take all those small thing I'm always rewriting on every project and move them to a single package so I can not only stop copying & pasting them all over the place but also maintain them all together.

There are two rules I followed when I had to decide what to put and what to keep somewhere else:

1. The utility needs to fit on a single file.
2. It shouldn't include any specific business logic from any other project.

## Information

| -            | -                                                                  |
|--------------|--------------------------------------------------------------------|
| Package      | wootils                                                            |
| Description  | A set of Javascript utilities for building Node and browser apps.  |
| Node Version | >= v6.10.0                                                         |

## Usage

The package is divided on 2 folders:

- `node`: Utilities only compatible with Node.
- `shared`: Utilities that can work on both browser and Node.

> Yes, when the time comes, it will have a `browser` folder too.

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

#### deferred

Create a deferred promise using the native `Promise` object.

[Read more about deferred](./documents/shared/deferred.md)

#### deferred

A small implementation of a pubsub service for handling events on an app.

[Read more about EventsHub](./documents/shared/eventsHub.md)

## Development

Before doing anything, install the repository hooks:

```bash
# You can either use npm or yarn, it doesn't matter
yarn run hooks
```

### NPM/Yarn Tasks

| Task                     | Description                         |
|--------------------------|-------------------------------------|
| `yarn run hooks`         | Install the GIT repository hooks.   |
| `yarn test`              | Run the project unit tests.         |
| `yarn run lint`          | Lint the modified files.            |
| `yarn run lint:full`     | Lint the project code.              |
| `yarn run docs`          | Generate the project documentation. |
| `yarn run todo`          | List all the pending to-do's.       |

### Testing

I use [Jest](https://facebook.github.io/jest/) with [Jest-Ex](https://yarnpkg.com/en/package/jest-ex) to test the project. The configuration file is on `./.jestrc`, the tests and mocks are on `./tests` and the script that runs it is on `./utils/scripts/test`.

### Linting

I use [ESlint](http://eslint.org) to validate all our JS code. The configuration file for the project code is on `./.eslintrc` and for the tests on `./tests/.eslintrc` (which inherits from the one on the root), there's also an `./.eslintignore` to ignore some files on the process, and the script that runs it is on `./utils/scripts/lint`.

### Documentation

I use [ESDoc](http://esdoc.org) to generate HTML documentation for the project. The configuration file is on `./.esdocrc` and the script that runs it is on `./utils/scripts/docs`.

### To-Dos

I use `@todo` comments to write all the pending improvements and fixes, and [Leasot](https://yarnpkg.com/en/package/leasot) to generate a report. The script that runs it is on `./utils/scripts/todo`.
