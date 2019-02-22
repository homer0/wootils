# SimpleStorage

An **abstract** class allows you to build services that relay on browser storage (session/local) and simplifies the way you work it.

The class doesn't have any public method, as the idea is for you to define your (let's call it) _"service"_ and then interact with the storage internally, using the _protected_ methods.

## Examples

### Basic

Let's say you have an app with a form for writing blog posts (or any kind of articles), and it has two fields: title and content.

The basic functionality is ready, when the user hits the `Save` button, you send the post to an API in order to publish. We can imagine a service like this:

```js
class Posts {
  save(title, content) {
    return fetch(...);
  }
}
```

But, what if we want to add a feature to save a draft of the post while the user is writing? in case something happens, we can prevent the user from losing what he/she wrote.

We can use `localStorage`! we need to write the functions to:

1. Save the draft, encoded as JSON.
2. Load the storage, check for the draft, decode it and restore.

And that's exactly what `SimpleStorage` can do for you:

```js
const SimpleStorage = require('wootils/browser/simpleStorage');

class Posts extends SimpleStorage {
  constructor(...) {
    super({
      storage: {
        name: 'posts',
        key: 'myApp-posts',
      },
    });
  }

  saveDraft(title, content) {
    this._setData({ title, content });
  }

  getDraft() {
    const draft = this._getData();
    return draft.title ? draft : null;
  }

  save(title, content) {
    this._delete();
    return fetch(...);
  }
}
```

Let's go over all the changes:

We first `require`/`import` the class and make `Posts` extend from it.

Then we use the constructor options to specify the name and key for the storage. The name is just a reference the class uses and the key is the actual key that will be used on the storage to save the data.

> Since we wanted `localStorage`, we don't need to touch any other default option, but if you are interested on the default options, take a look at the technical documentation for the class.

We add `saveDraft` and `getDraft`: As you can imagine, `saveDraft` just tells the class to save an object, and based on the storage options, the class already knows that the object should be encoded as a JSON before saving it, no need to worry about that.

`getDraft` will just try to obtain the data and make sure there's a draft there; the whole process where the class checks the storage and loads its contents has been already taken care of.

The reason we check for `.title` is because the class will check if there's something on the storage using the key from the options, and if there's nothing, it will add an empty object in order to work with future data.

And the last modification is the call to `_delete` on the `save` method: We are going to finally save the post, so it's ok to delete the draft from the storage: this is basically a _"clean up"_.

Now... there's a problem with this implementation: we are using `localStorage`, so if the user is writing different posts on different browser tabs, they'll overwrite each other (yeah, that seems like an odd scenario, but it may happen).

We should switch to `sessionStorage` and keep the draft limited to each tab. Doing that with `SimpleStorage` is quite easy:

```js
const SimpleStorage = require('wootils/browser/simpleStorage');

class Posts extends SimpleStorage {
  constructor(...) {
    super({
      storage: {
        name: 'posts',
        key: 'myApp-posts',
        typePriority: ['session', 'local'],
      },
    });
  }
...
```

By adding the `storage.typePriority` option, we tell the class to use `sessionStorage` if available and switch to `localStorage` as a fallback.

### Working with entries

On the example above we saw how to save, read and delete a simple object from the storage, but `SimpleStorage` allows you to also work with different objects: Entries.

When working with entries, instead of just sending an object to the storage, you can have like a _"storage inside the storage"_, where you can assign different keys for different objects... and even and expiration time for them.

Let's illustrate this with an example: You have an app that, when a user navigates to _"its profile page"_, it makes some requests to load some "settings", like this:

```js
class Users {
  ...
  getUserProfileSettings(userId) {
    const result = {};
    this.getUserProfile(userId)
    .then((userProfile) => {
      result.userProfile = userProfile;
      return this.getUserAppSettings(userId);
    })
    .then((appSettings) => {
      result.appSettings = appSettings;
      return this.getUserUISettings(userId);
    })
    .then((uiSettings) => {
      result.uiSettings = uiSettings;
      return result;
    })
    .catch(...)
    .then(() => {
      this._turnOffThatCrazyAjaxLoadIndicator(): // :P
    });
  }

  getUserProfile(userId) {
    return fetch(`/user-profile/${userId}`)
    .then((resp) => resp.json());
  }

  getUserAppSettings(userId) {
    return fetch(`/user-app-settings/${userId}`)
    .then((resp) => resp.json());
  }

  getUserUISettings(userId) {
    return fetch(`/user-ui-settings/${userId}`)
    .then((resp) => resp.json());
  }
}
```

> Yes, you could also use `async`/`await` or `Promise.all`, but this is just a simple example.

But what if we know that it's hardly possible that those setting would change in the near future and that the app may need to do those requests for more than just the _"profile page"_?

We can do something like on the example above and store everything on the local storage, right? well... manipulating a single object in order to put the responses of all the different request will require some extra coding and it may seem like an overkill, so, that's why `SimpleStorage` has entries.

We can use the entries feature to store each request as a different _entry_, and even tell the class to just keep them for an 2 hours, after that, make the request again.

Let's start by adding `SimpleStorage` and enabling the feature:

```js
const SimpleStorage = require('wootils/browser/simpleStorage');

class Users extends SimpleStorage {
  constructor(...) {
    super({
      storage: {
        name: 'user-requests',
        key: 'myApp-user-requests',
      },
      entries: {
        enabled: true,
        expiration: 7200,
      }
    });
  }
...
```

We first `require`/`import` the class and make `Users` extend from it.

Then we use the constructor options to:

1. Specify the name and key for the storage. The name is just a reference the class uses and the key is the actual key that will be used on the storage to save the data.
2. Enable the feature `entries.enabled` and set the expiration time of each entry (2 hours, in seconds).

Now we need to add a method to cache the requests as entries:

```js
cacheRequest(url) {
  const entry = this._getEntry(url);
  return entry ?
    Promise.resolve(entry.value) :
    this._saveEntry(fetch(url).then((resp) => resp.json()));
}
```

As you can see, the method first uses `_getEntry`, to locate an entry for the received URL.

If an entry was found, it uses `Promise.resolve` to return the value. The reason for returning a `Promise` is so method will always return a promise even if the request doesn't fire.

But if there's no entry, it calls `_saveEntry` with the result of the `fetch` request.

> You can send an object or a promise to `_saveEntry` and `_sendData`, the class will wait for it to be resolved and _then_ use the received value.

That's all for the method; like on the other example, `SimpleStorage` will take care of writing and reading the entries and their values for the storage.

Time to refactor! We need to change the _"get methods"_ and make them use the new `cacheRequest`:

```js
...
getUserProfile(userId) {
  return this.cacheRequest(`/user-profile/${userId}`);
}

getUserAppSettings(userId) {
  return this.cacheRequest(`/user-app-settings/${userId}`);
}

getUserUISettings(userId) {
  return this.cacheRequest(`/user-ui-settings/${userId}`);
}
...
```

Done! Now the request will only trigger if there's nothing on the storage (this includes entries that were deleted because they expired.

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://homer0.github.io/wootils/class/wootils/browser/simpleStorage.js~SimpleStorage.html) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```
