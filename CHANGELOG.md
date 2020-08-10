## [4.0.1](https://github.com/homer0/wootils/compare/4.0.0...4.0.1) (2020-08-10)


### Bug Fixes

* small fixes to the types and implement cjs2esm ([79137a4](https://github.com/homer0/wootils/commit/79137a41dc5233281cd6455ab20fe95f992d257f)), closes [#70](https://github.com/homer0/wootils/issues/70)
* use cjs2esm for the ESM version ([d65e109](https://github.com/homer0/wootils/commit/d65e109067b8713cfcb4d82930d54aaa4eebd628))
* use proper types for providers ([ab5691e](https://github.com/homer0/wootils/commit/ab5691e8a92da50d6ed5b6d924fc3892890c80d7))

# [4.0.0](https://github.com/homer0/wootils/compare/3.0.4...4.0.0) (2020-07-19)


### Bug Fixes

* add a package.json with the type 'module' on the ESM directory ([9e1521b](https://github.com/homer0/wootils/commit/9e1521b374e92bcdbd282e46d530325b4d21d2e7))
* **node/logger:** use provider creators ([c2197a3](https://github.com/homer0/wootils/commit/c2197a36a5abf223bdce48daaea1d05996b1162c))
* make all class properties private/protected with public getters ([f78a7e6](https://github.com/homer0/wootils/commit/f78a7e667c54c7c3d8e86c061c0fe6bd360b1617)), closes [#68](https://github.com/homer0/wootils/issues/68)
* **node/errorhandler:** use a provider creator ([b53b71e](https://github.com/homer0/wootils/commit/b53b71eab3f020f6b5f36e5b52961b45bc7a5958))
* migrate from ESDoc to JSDoc ([65ab6cd](https://github.com/homer0/wootils/commit/65ab6cdaa69b79fca64efc6af458a5ae4d662661))
* remove 'main' from package.json ([515165a](https://github.com/homer0/wootils/commit/515165a0837489a3302eaba8754321dd363f9dea))
* use 'named' exports on the folders' indexes ([1ce2f2c](https://github.com/homer0/wootils/commit/1ce2f2ce0af6ac16a2b19a5be06b0966220b7990))
* **node:** remove the providers that no longer exist ([544c9e8](https://github.com/homer0/wootils/commit/544c9e81e9798bf343346b064bf41b20551da9d6))
* **node:** use provider creators ([7f54d4e](https://github.com/homer0/wootils/commit/7f54d4e662b9510bd91fe68a3a2e8b51c9fb8327)), closes [#67](https://github.com/homer0/wootils/issues/67)
* **node/appconfiguration:** make all the class properties private/protected ([eab4cab](https://github.com/homer0/wootils/commit/eab4cab9f4ac8eb60b2fc58fec9542174a648e33))
* **node/appconfiguration:** use a provider creator ([ece3f9d](https://github.com/homer0/wootils/commit/ece3f9d2c3fd7061ca780bd821616628f8f238e3))
* **node/errorhandler:** make the properties private/protected ([82c7aa2](https://github.com/homer0/wootils/commit/82c7aa27dd5fe0bda2994a3af4e7970dad46adf2))
* **node/pathutils:** use a provider creator ([100fb44](https://github.com/homer0/wootils/commit/100fb449d953f2bfd1ef2d6af11d735c5cae9a71))
* **shared/apiclient:** make the properties private/protected ([da216d3](https://github.com/homer0/wootils/commit/da216d328e50e08c91846cecdaec2e7cbb0335fc))
* **shared/deepAssign:** use spread instead of .freeze ([bb8503c](https://github.com/homer0/wootils/commit/bb8503cc835c90c6d1f2e208a2827daf0039c302))


### Features

* add ESM version ([aebdab6](https://github.com/homer0/wootils/commit/aebdab60f774ba97bffad356c8d4cad783230d0c)), closes [#61](https://github.com/homer0/wootils/issues/61)
* add the deepAssign module ([d766a49](https://github.com/homer0/wootils/commit/d766a490c93aa654113a41762c607b6601095c6d)), closes [#63](https://github.com/homer0/wootils/issues/63)
* add the deepAssign module ([1e9247b](https://github.com/homer0/wootils/commit/1e9247b8d9bf5a5165f8a5cee9a28437aab5b08f))
* add the new Jimple wrappers ([67a8e6e](https://github.com/homer0/wootils/commit/67a8e6e71015d6ffc3007e089afac6dddb13298e)), closes [#66](https://github.com/homer0/wootils/issues/66)
* add the new Jimple wrappers ([0afc6a3](https://github.com/homer0/wootils/commit/0afc6a35c50c3f4c31fed5159280f4b84bf7e855))
* add warn alias for warning on the Logger ([38cf90c](https://github.com/homer0/wootils/commit/38cf90c09bccf4ecb09d2ebf8ceac00b611e61fb))
* fix the the types for the APIClient and validate with ts-check ([346449b](https://github.com/homer0/wootils/commit/346449bb8775b1438c35e7bf982f7d3ffb0e37d5))
* **node/environmentutils:** use a provider creator ([c6821f9](https://github.com/homer0/wootils/commit/c6821f925f97bc01d5d706ffdb937beb96ebb3bb))
* **node/packageInfo:** use a provider creator ([fe66556](https://github.com/homer0/wootils/commit/fe66556d65ffe7e85d6c48272c277dd8bc4ef986))
* **node/rootRequire:** use a provider creator ([9da0d2f](https://github.com/homer0/wootils/commit/9da0d2fb4e0974b556c5967d41105e5740f210b2))


### BREAKING CHANGES

* **shared/apiclient:** The method `flattenEndpoints` was removed; it was just a wrapper for a call to
`ObjectUtils`.
* **node/errorhandler:** The properties for `.appLogger` and `.eventNames` are not longer accesible.
* **node/appconfiguration:** The properties for `.environmentUtils` and `rootRequire` are not longer accessible.
* **node/logger:** The providers `loggerWithOptions` and `appLoggerWithOptions` were removed.
* **node/pathutils:** The provider `pathUtilsWithHome` doesn't exist anymore.
* **node/errorhandler:** The provider `errorHandlerWithOptions` doesn't exist anymore.
* **node/appconfiguration:** The `appConfiguration` function is now a provider creator and its signature changed
* The error method now adds the status to the returned error message
