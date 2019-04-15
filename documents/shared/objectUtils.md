# ObjectUtils

A small collection of utility methods to work with objects that relies on [`extend`](https://yarnpkg.com/en/package/extend) for deep merge and copy.

## Examples

### `merge`

Make a deep merge of a list of objects.

```js
const objA = { a: 'first' };
const objB = { b: 'second' };

console.log(ObjectUtils.merge(objA, objB));
// Will output { a: 'first', b: 'second' }
```

### `copy`

Make a deep copy of an object.

```js
const objA = { a: 'first' };
const objB = ObjectUtils.copy(objA);
objA.b = 'second';

console.log(objB);
// Will output { a: 'first' }
```

### `get`

Read a property from an object using a path:

```js
const obj = {
  propOne: {
    propOneSub: 'Charito!',
  },
  propTwo: '!!!',
};

console.log(ObjectUtils.get(
  obj,
  'propOne.propOneSub'
));
// Will output 'Charito!'
```
### `set`

Set a property on an object using a path. If the path doesn't exist, it will be created.

```js
const target = {};

console.log(ObjectUtils.set(target, 'some.prop.path', 'some-value'));
// Will output { some: { prop: { path: 'some-value' } } }
```

### `extract`

Extracts a property or properties from an object in order to create a new one.

```js
const target = {
  name: {
    first: 'Rosario',
  },
  age: 3,
  address: {
    planet: 'earth',
    something: 'else',
  },
};

console.log(ObjectUtils.set(obj, [
  { 'name': 'name.first'},
  'age',
  'address.planet'
]));
// Will output { name: 'Rosario', age: 3, address: { planet: 'earth' } }
```

### `delete`

Delete a property of an object using a path. If by removing a property of a sub object, the object has no more keys, it also removes it.

```js
const target = {
  propOne: {
    propOneSub: 'Charito!',
  },
  propTwo: '!!!',
};

console.log(ObjectUtils.delete(
  target,
  'propOne.propOneSub'
));
// Will output { propTwo: '!!!' }
```

## Technical documentation

The code is fully documented with [ESDoc](https://esdoc.org) and you can either read the generated documentation [online](https://homer0.github.io/wootils/class/wootils/shared/eventsHub.js~EventsHub.html) or generate it yourself using:

```bash
# You can either use npm or yarn, it doesn't matter
npm run docs
open ./docs/index.html
```