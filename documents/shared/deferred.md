# deferred

Create a deferred promise using the native `Promise` object.

## Example

Using it is really simple, you call the `deferred()` function and get an object with `promise`, `resolve` and `reject`. You return the `promise` property and then call `resolve` or `reject` to either resolve the promise or reject it.

Now, a reason to use this is for when you have another service/function/something asking for something that your code hasn't even started to do:

> I'm using Node and [`fs-extra`](https://yarnpkg.com/en/package/fs-extra) because of the Promise based interface for `fs`.

```js
const fs = require('fs-extra');
const { deferred } = require('wootils/shared');

class MyServiceThatLoadsAfile {
  constructor() {
    this._defer = deferred();
    this._fileContents = null;
  }

  getFileContents() {
    return this._fileContents ?
      Promise.resolve(this._fileContents) :
      this._defer.promise;
  }

  loadTheFile() {
    return fs.readFile('some-path', 'utf-8')
    .then((contents) => {
      this._fileContents = contents;
      this.defer.resolve(contents);
    })
    .catch((error) => {
      this.defer.reject(error);
    });
  }
}

const myService = new MyServiceThatLoadsAfile();
myService.getFileContents()
.then((contents) => {
  console.log('GOT IT', contents);
});

// ...
myService.loadTheFile();
```

Ok, there's a lot going on this example, let's break it:

1. `MyServiceThatLoadsAFile` creates a deferred promise on its constructor.
2. `getFileContents` should return the file contents, but because the file is not loaded yet (because `loadTheFile` has not been called), it returns the deferred promise.
3. Eventually, `loadTheFile` gets called, it loads the file and either resolves or rejects the deferred promise, so the `getFileContents().then(...)` gets finally called.

I wanted to keep the example small, but on a real app, `getFileContents` is probably called by other service that has no idea the instance was just created or that `loadTheFile` hasn't been called yet.

## Technical documentation

- Function: {@link module:shared/deferred.deferred|deferred}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
