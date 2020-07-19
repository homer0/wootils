# DeepAssign

Deep merge (and copy) of objects(`{}`) and `Array`s using native spread syntax.

1. It supports `Symbol`s as keys.
2. It even merges objects inside `Array`s.
3. It can merge `Array`s as properties, concatenate them or even overwrite them.

## Examples

### Simple merge

```js
const { deepAssign } = require('wootils/shared');

const generateOptions = (options = {}) => deepAssign(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
    enabled: false,
    features: {
      accounts: true,
      blog: false,
    },
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
  enabled: true,
  features: {
    blog: true,
    projects: true,
  },
  extras: null,
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', enabled: true, url: '/me' },
 *     'projects',
 *   ],
 *   enabled: true,
 *   features: {
 *     accounts: true,
 *     blog: true,
 *     projects: true,
 *   },
 *   extras: null,
 * }
```

### Symbols as keys

```js
const { deepAssign } = require('wootils/shared');

const FEATURES_KEY = Symbol('features');

const generateOptions = (options = {}) => deepAssign(
  {
    title: 'myApp',
    [FEATURES_KEY]: {
      accounts: true,
      blog: false,
    },
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  [FEATURES_KEY]: {
    blog: true,
    projects: true,
  },
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   [Symbol(features)]: {
 *     accounts: true,
 *     blog: true,
 *     projects: true,
 *   },
 * }
```

### Arrays concatenation

This feature allows for Arrays found inside properties to be concatenated instead of merging them. To use it, you have to manually instantiate the {@link DeepAssign} class, or use the {@link module:shared/deepAssign.deepAssignWithConcat|deepAssignWithConcat} function:

```js
const { deepAssignWithConcat } = require('wootils/shared');

const generateOptions = (options = {}) => deepAssignWithConcat(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'about', enabled: true },
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```

### Arrays overwrite

This allows you to, instead of merging Arrays inside object properties, to overwrite them entirely. Just like for concatenation, to use it you have to instantiate the {@link DeepAssign} class or use the {@link module:shared/deepAssign~deepAssignWithOverwrite|deepAssignWithOverwrite} function:

```js
const { deepAssignWithOverwrite } = require('wootils/shared');

const generateOptions = (options = {}) => deepAssignWithOverwrite(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```

### Arrays shallow merge

If you want to merge the Arrays, but don't want it to go as deep as the objects inside, you can use do a "shallow merge". Like all the other strategies, you can instantiate the {@link DeepAssign} class directly, or use {@link module:shared/deepAssign~deepAssignWithShallowMerge|deepAssignWithShallowMerge}:

```js
const { deepAssignWithShallowMerge } = require('wootils/shared');

const generateOptions = (options = {}) => deepAssignWithShallowMerge(
  {
    title: 'myApp',
    sections: [{ title: 'about', enabled: true }],
  },
  options,
);

console.log(generateOptions({
  title: 'my AWESOME app',
  sections: [{ title: 'ME', url: '/me' }, 'projects'],
}));
/**
 * {
 *   title: 'my AWESOME app',
 *   sections: [
 *     { title: 'ME', url: '/me' },
 *     'projects',
 *   ],
 * }
```
## ES Modules

If you are using ESM, you can import the class and the functions from the `/esm` sub path:

```js
import {
  DeepAssign,
  deepAssign,
  deepAssignWithConcat,
  deepAssignWithOverwrite,
  deepAssignWithShallowMerge,
} from 'wootils/esm/shared/deepAssign';

// or

import {
  DeepAssign,
  deepAssign,
  deepAssignWithConcat,
  deepAssignWithOverwrite,
  deepAssignWithShallowMerge,
} from 'wootils/esm/shared';
```

## Technical documentation

- Function: {@link module:shared/deepAssign~deepAssign|deepAssign}
- Function with array concatenation: {@link module:shared/deepAssign~deepAssignWithConcat|deepAssignWithConcat}
- Function with array overwrite: {@link module:shared/deepAssign~deepAssignWithOverwrite|deepAssignWithOverwrite}
- Function with array shallow merge: {@link module:shared/deepAssign~deepAssignWithShallowMerge|deepAssignWithShallowMerge}
- Helper class: {@link DeepAssign}

> If you are reading this form the markdown document, you can go to the [online version](https://homer0.github.io/wootils); or you can generate the documentation site yourself by running the `docs` command:
>
> ```bash
> # You can either use npm or yarn, it doesn't matter
> npm run docs && open ./docs/index.html;
> ```
