# EventsHub

A small implementation of a pubsub service for handling events on an app.

It doesn't require any configuration or have customization options: You listen for an event with `on`, emit an event with `emit` and reduce a variable through an event with `reduce`.

## Examples

First, let's create an instance of the hub:

```js
const { EventsHub } = require('wootils/shared');
const events = new EventsHub();
```

### Listen and emit

```js
// Add the listener
events.on('my-event', () => {
  console.log('The event listener was called!');
});
// Emit the event
events.emit('my-event');
```

Quite simple, right? You can also send any number of parameters to the events:

```js
// Add the listener
events.on('user-login', (username, password) => {
  someAuthService.login(username, password)
  .then((userInfo) => {
    events.emit('user-login-successfull', userInfo);
  })
  .catch((error) => {
  	 events.emit('user-login-failed', error);
  });
});

...

events.emit('user-login', 'rosario', 'p4ssword');
```

And you can even use the same listener for multiple events:

```js
// Add the listener
events.on(['logout-route', 'unauthorized-request'], () => {
  someAuthService.signout();
});

...

events.emit('logout-route');
// or
someRequest()
.then(() => ... )
.catch((error) => {
  if (error.code === 401) {
    events.emit('unauthorized-request');
  }
})
```

> All methods that support an event name also support an `Array` with a list of them.

### Reduce a variable

It's basically the same as calling `emit`, but the first parameter may be modified by the listeners and it's returned after it went through all of them.

```js
events.on('filter-users-list', (list) => {
  list.splice(1, 1);
  return list;
});

const usersList = ['charito', 'Rosario'];
const newUsersList = events.reduce('filter-users-list', usersList);
console.log(newUsersList);
// Will log ['charito']
```

> `reduce` also supports sending any number of parameters after the target variable.

You can also reduce a variable on an asychroneous way with `reduceAsync`:

```js
events.on('filter-users-list', async (list) => {
  const fromAPI = await getUsersToFilterFromSomeAPI('...', { list });
  return list.filter((item) => !fromAPI.includes(item));
});

const usersList = ['charito', 'Rosario'];
const newUsersList = await events.reduceAsync('filter-users-list', usersList);
```

## ES Modules

If you are using ESM, you can import the class from the `/esm` sub path:

```js
import EventsHub from 'wootils/esm/shared/eventsHub';

// or

import { EventsHub } from 'wootils/esm/shared';
```

## Technical documentation

- Class: {@link EventsHub}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
