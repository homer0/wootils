jest.unmock('/shared/objectUtils');

require('jasmine-expect');
const ObjectUtils = require('/shared/objectUtils');

describe('ObjectUtils', () => {
  it('should throw an error when instantiated', () => {
    // Given/When/Then
    expect(() => new ObjectUtils()).toThrow(/ObjectUtils is a static class/i);
  });

  it('should merge two objects into a new one', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const objA = { name };
    const objB = { nickname };
    let result = null;
    // When
    result = ObjectUtils.merge(objA, objB);
    objA.random = 'value';
    objB.random = 'value';
    // Then
    expect(result).toEqual({ name, nickname });
  });

  it('should merge two objects from arrays', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const arrA = [{ name }];
    const arrB = [{ nickname }];
    let result = null;
    // When
    result = ObjectUtils.merge(arrA, arrB);
    arrA.push('value');
    arrB.push('value');
    // Then
    expect(result).toEqual([{ name, nickname }]);
  });

  it('should make a copy of an object', () => {
    // Given
    const name = 'Rosario';
    const nickname = 'Charito';
    const address = {
      street: 'random street',
      number: 'random number',
      zip: 'random zip',
    };
    const original = {
      name,
      nickname,
      address,
    };
    let result = null;
    // When
    result = ObjectUtils.copy(original);
    original.random = 'value';
    // Then
    expect(result).toEqual({ name, nickname, address });
  });

  describe('get', () => {
    it('should read a property from an object using its name', () => {
      // Given
      const target = {
        city: 'Springfield',
      };
      let result = null;
      // When
      result = ObjectUtils.get(target, 'city');
      // Then
      expect(result).toBe(target.city);
    });

    it('should read a property from an object using a path', () => {
      // Given
      const name = 'Springfield';
      const target = {
        address: {
          city: {
            name,
          },
        },
      };
      let result = null;
      // When
      result = ObjectUtils.get(target, 'address.city.name');
      // Then
      expect(result).toBe(name);
    });

    it('should read a property from an object using a custom path', () => {
      // Given
      const name = 'Springfield';
      const target = {
        address: {
          city: {
            name,
          },
        },
      };
      let result = null;
      // When
      result = ObjectUtils.get(target, 'address/city/name', '/');
      // Then
      expect(result).toBe(name);
    });

    it('should read a property from an object and support arrays', () => {
      // Given
      const name = 'Springfield';
      const target = {
        addressList: [
          { city: null },
          {
            city: {
              name,
            },
          },
        ],
      };
      let result = null;
      // When
      result = ObjectUtils.get(target, 'addressList.1.city.name');
      // Then
      expect(result).toBe(name);
    });

    it('shouldn\'t throw an error when trying to read a property that doesn\'t exist', () => {
      // Given
      const target = {};
      const fakePath = 'something';
      let result = null;
      // When
      result = ObjectUtils.get(target, fakePath);
      // Then
      expect(result).toBeUndefined();
    });

    it('shouldn\'t throw an error when trying to read a path that doesn\'t exist', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const target = {
        [topElement]: {},
      };
      const fakePath = `${topElement}.${childElement}`;
      let result = null;
      // When
      result = ObjectUtils.get(target, fakePath, '.', false);
      // When/Then
      expect(result).toBeUndefined();
    });

    it('should throw an error when trying to read a property that doesn\'t exist', () => {
      // Given
      const target = {};
      const fakePath = 'something';
      // When/Then
      expect(() => ObjectUtils.get(target, fakePath, '.', true))
      .toThrow(new RegExp(`there's nothing on '${fakePath}'`, 'i'));
    });

    it('should throw an error when trying to read a path that doesn\'t exist', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const grandChildElement = 'first';
      const target = {
        [topElement]: {},
      };
      const fakePath = `${topElement}.${childElement}.${grandChildElement}`;
      // When/Then
      expect(() => ObjectUtils.get(target, fakePath, '.', true))
      .toThrow(new RegExp(`there's nothing on '${topElement}.${childElement}'`, 'i'));
    });
  });

  describe('set', () => {
    it('should set a property on an object using its name', () => {
      // Given
      const target = {};
      const objPath = 'planet';
      const value = 'earth';
      let result = null;
      // When
      result = ObjectUtils.set(target, objPath, value);
      // Then
      expect(result).toEqual({ [objPath]: value });
      expect(target).toEqual({});
    });

    it('should set a property on an object using a path', () => {
      // Given
      const topElement = 'person';
      const target = {
        [topElement]: {},
      };
      const copy = ObjectUtils.copy(target);
      const childElement = 'name';
      const objPath = `${topElement}.${childElement}`;
      const value = 'Rosario';
      let result = null;
      // When
      result = ObjectUtils.set(target, objPath, value);
      // Then
      expect(result).toEqual({
        [topElement]: {
          [childElement]: value,
        },
      });
      expect(target).toEqual(copy);
    });

    it('should set a property on an object using a custom path', () => {
      // Given
      const topElement = 'person';
      const target = {
        [topElement]: {},
      };
      const copy = ObjectUtils.copy(target);
      const childElement = 'name';
      const grandChildElement = 'first';
      const delimiter = '/';
      const objPath = `${topElement}${delimiter}${childElement}${delimiter}${grandChildElement}`;
      const value = 'Rosario';
      let result = null;
      // When
      result = ObjectUtils.set(target, objPath, value, delimiter);
      // Then
      expect(result).toEqual({
        [topElement]: {
          [childElement]: {
            [grandChildElement]: value,
          },
        },
      });
      expect(target).toEqual(copy);
    });

    it('should set a property on an object using a path and support arrays', () => {
      // Given
      const topElement = 'people';
      const childElement = 'name';
      const age = 3;
      const firstEntry = { [childElement]: 'Charito', age };
      const target = {
        [topElement]: [
          firstEntry,
          { age },
        ],
      };
      const copy = ObjectUtils.copy(target);
      const objPath = `${topElement}.1.${childElement}`;
      const value = 'Rosario';
      let result = null;
      // When
      result = ObjectUtils.set(target, objPath, value);
      // Then
      expect(result).toEqual({
        [topElement]: [
          firstEntry,
          {
            [childElement]: value,
            age,
          },
        ],
      });
      expect(target).toEqual(copy);
    });

    it('shouldn\'t throw an error when trying to set a property on an non object path', () => {
      // Given
      const topElement = 'people';
      const childElement = 'name';
      const grandChildElement = 'first';
      const value = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: value,
        },
      };
      const objPath = `${topElement}.${childElement}.${grandChildElement}`;
      let result = null;
      // When
      result = ObjectUtils.set(target, objPath, value);
      // Then
      expect(result).toBeUndefined();
    });

    it('should throw an error when trying to set a property on an non object path', () => {
      // Given
      const topElement = 'people';
      const childElement = 'name';
      const grandChildElement = 'first';
      const value = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: value,
        },
      };
      const objPath = `${topElement}.${childElement}.${grandChildElement}`;
      // When/Then
      expect(() => ObjectUtils.set(target, objPath, value, '.', true))
      .toThrow(new RegExp(
        `There's already an element of type 'string' on '${topElement}.${childElement}'`,
        'i'
      ));
    });
  });

  describe('extract', () => {
    it('should extract a list of properties from an object', () => {
      // Given
      const properties = ['name', 'address'];
      const propertiesObject = properties.reduce(
        (acc, name) => Object.assign(acc, {
          [name]: `${name}-value`,
        }),
        {}
      );
      const target = Object.assign(
        {},
        propertiesObject,
        {
          random: 'value',
          planet: 'earth',
        }
      );
      const copy = ObjectUtils.copy(target);
      let result = null;
      // When
      result = ObjectUtils.extract(target, properties);
      // Then
      expect(result).toEqual(propertiesObject);
      expect(target).toEqual(copy);
    });

    it('should extract a property with a path', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const childElementValue = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: [childElementValue],
          age: 3,
          planet: 'earth',
        },
      };
      let result = null;
      // When
      result = ObjectUtils.extract(target, [`${topElement}.${childElement}`]);
      // Then
      expect(result).toEqual({
        [topElement]: {
          [childElement]: [childElementValue],
        },
      });
    });

    it('should extract a property with a custom path into a custom location', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const childElementValue = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: [childElementValue],
          age: 3,
          planet: 'earth',
        },
      };
      const delimiter = '/';
      let result = null;
      // When
      result = ObjectUtils.extract(
        target,
        {
          [childElement]: `${topElement}${delimiter}${childElement}`,
        },
        '/'
      );
      // Then
      expect(result).toEqual({
        [childElement]: [childElementValue],
      });
    });

    it('shouldn\'t throw an error when trying to extract from an invalid path', () => {
      // Given
      const topElement = 'person';
      const target = {};
      let result = null;
      // When
      result = ObjectUtils.extract(target, topElement);
      // Then
      expect(result).toEqual({});
    });

    it('should throw an error when trying to extract from an invalid path', () => {
      // Given
      const topElement = 'person';
      const target = {};
      // When/Then
      expect(() => ObjectUtils.extract(target, topElement, '.', true))
      .toThrow(new RegExp(`There's nothing on '${topElement}'`, 'i'));
    });

    it('shouldn\'t throw an error when trying to extract reusing a path', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const childElementValue = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: childElementValue,
          age: 3,
          planet: 'earth',
        },
      };
      let result = null;
      // When
      result = ObjectUtils.extract(
        target,
        [
          { [topElement]: `${topElement}.${childElement}` },
          { [`${topElement}.${childElement}`]: `${topElement}.${childElement}` },
        ]
      );
      // Then
      expect(result).toBeUndefined();
    });

    it('should throw an error when trying to extract reusing a path', () => {
      // Given
      const topElement = 'person';
      const childElement = 'name';
      const childElementValue = 'Rosario';
      const target = {
        [topElement]: {
          [childElement]: childElementValue,
          age: 3,
          planet: 'earth',
        },
      };
      // When/Then
      expect(() => ObjectUtils.extract(
        target,
        [
          { [topElement]: `${topElement}.${childElement}` },
          { [`${topElement}.${childElement}`]: `${topElement}.${childElement}` },
        ],
        '.',
        true
      ))
      .toThrow(new RegExp(
        `There's already an element of type 'string' on '${topElement}'`,
        'i'
      ));
    });
  });

  describe('delete', () => {
    it('should delete a property from an object using its name', () => {
      // Given
      const topElement = 'name';
      const target = {
        [topElement]: 'something',
      };
      const copy = ObjectUtils.copy(target);
      let result = null;
      // When
      result = ObjectUtils.delete(target, topElement);
      // Then
      expect(result).toEqual({});
      expect(target).toEqual(copy);
    });

    it('should delete a property from an object using its path', () => {
      // Given
      const topElement = 'name';
      const childElement = 'first';
      const target = {
        [topElement]: {
          [childElement]: 'something',
        },
      };
      const copy = ObjectUtils.copy(target);
      let result = null;
      // When
      result = ObjectUtils.delete(target, `${topElement}.${childElement}`);
      // Then
      expect(result).toEqual({});
      expect(target).toEqual(copy);
    });

    it('should delete a property from an object using a custom path', () => {
      // Given
      const topElement = 'name';
      const childElement = 'first';
      const otherElement = 'last';
      const otherElementValue = 'last name';
      const target = {
        [topElement]: {
          [childElement]: 'something',
          [otherElement]: otherElementValue,
        },
      };
      const copy = ObjectUtils.copy(target);
      const delimiter = '/';
      let result = null;
      // When
      result = ObjectUtils.delete(
        target,
        `${topElement}${delimiter}${childElement}`,
        delimiter
      );
      // Then
      expect(result).toEqual({
        [topElement]: {
          [otherElement]: otherElementValue,
        },
      });
      expect(target).toEqual(copy);
    });

    it('should delete a property from an object but not clean the parent object', () => {
      // Given
      const topElement = 'name';
      const childElement = 'first';
      const target = {
        [topElement]: {
          [childElement]: 'something',
        },
      };
      const copy = ObjectUtils.copy(target);
      let result = null;
      // When
      result = ObjectUtils.delete(target, `${topElement}.${childElement}`, '.', false);
      // Then
      expect(result).toEqual({
        [topElement]: {},
      });
      expect(target).toEqual(copy);
    });
  });

  describe('flat', () => {
    it('should flattern the properties of an object', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const alias = null;
      const age = 3;
      const total = 1;
      const numbers = [
        'one',
        'two',
        'three',
      ];
      const target = {
        total,
        person: {
          age,
          names: {
            name,
            nickname,
            alias,
          },
          numbers,
        },
      };
      let result = null;
      const expected = Object.assign(
        {
          total,
          'person.age': age,
          'person.names.name': name,
          'person.names.nickname': nickname,
          'person.names.alias': alias,
        },
        numbers.reduce(
          (acc, item, index) => Object.assign({}, acc, {
            [`person.numbers.${index}`]: item,
          }),
          {}
        )
      );
      // When
      result = ObjectUtils.flat(target);
      // Then
      expect(result).toEqual(expected);
    });

    it('should flattern the properties of an object using a custom path', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const total = 1;
      const numbers = [
        'one',
        'two',
        'three',
      ];
      const target = {
        total,
        person: {
          age,
          names: {
            name,
            nickname,
          },
          numbers,
        },
      };
      const separator = '/';
      let result = null;
      const expected = Object.assign(
        {
          total,
          [`person${separator}age`]: age,
          [`person${separator}names${separator}name`]: name,
          [`person${separator}names${separator}nickname`]: nickname,
        },
        numbers.reduce(
          (acc, item, index) => Object.assign({}, acc, {
            [`person${separator}numbers${separator}${index}`]: item,
          }),
          {}
        )
      );
      // When
      result = ObjectUtils.flat(target, separator);
      // Then
      expect(result).toEqual(expected);
    });

    it('should flattern the properties except those filtered by a callback', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const total = 1;
      const numbers = [
        'one',
        'two',
        'three',
      ];
      const target = {
        total,
        person: {
          age,
          names: {
            name,
            nickname,
          },
          numbers,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.flat(target, '.', '', (key, value) => !Array.isArray(value));
      // Then
      expect(result).toEqual({
        total,
        'person.age': age,
        'person.names.name': name,
        'person.names.nickname': nickname,
        'person.numbers': numbers,
      });
    });
  });

  describe('unflat', () => {
    it('should un-flattern a list of properties into a new object', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const total = 1;
      const numbers = [
        'one',
        'two',
        'three',
      ];
      const target = {
        total,
        'person.age': age,
        'person.names.name': name,
        'person.names.nickname': nickname,
        'person.numbers': numbers,
      };
      let result = null;
      // When
      result = ObjectUtils.unflat(target);
      // Then
      expect(result).toEqual({
        total,
        person: {
          age,
          names: {
            name,
            nickname,
          },
          numbers,
        },
      });
    });

    it('should un-flattern a list of properties into a new object using a custom path', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const total = 1;
      const numbers = [
        'one',
        'two',
        'three',
      ];
      const separator = '/';
      const target = {
        total,
        [`person${separator}age`]: age,
        [`person${separator}names${separator}name`]: name,
        [`person${separator}names${separator}nickname`]: nickname,
        [`person${separator}numbers`]: numbers,
      };
      let result = null;
      // When
      result = ObjectUtils.unflat(target, separator);
      // Then
      expect(result).toEqual({
        total,
        person: {
          age,
          names: {
            name,
            nickname,
          },
          numbers,
        },
      });
    });
  });

  describe('formatKeys', () => {
    it('should make all keys first letters into upper case', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const target = {
        name,
        nickname,
        age,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase()
      );
      // Then
      expect(result).toEqual({
        Name: name,
        Nickname: nickname,
        Age: age,
      });
    });

    it('should make all keys first letters into upper case (null and undefined)', () => {
      // Given
      const name = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const likes = null;
      const hates = undefined;
      const target = {
        name,
        nickname,
        age,
        likes,
        hates,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase()
      );
      // Then
      expect(result).toEqual({
        Name: name,
        Nickname: nickname,
        Age: age,
        Likes: likes,
        Hates: hates,
      });
    });

    it('should make specific keys first letters into upper case', () => {
      // Given
      const first = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const likes = 'ice-cream';
      const target = {
        name: {
          first,
          nickname,
        },
        age,
        likes,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase(),
        ['name.first', 'likes']
      );
      // Then
      expect(result).toEqual({
        name: {
          First: first,
          nickname,
        },
        age,
        Likes: likes,
      });
    });

    it('should make specific keys first letters into upper case (incomplete paths)', () => {
      // Given
      const first = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const likes = 'ice-cream';
      const target = {
        name: {
          first,
          nickname,
        },
        age,
        likes,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase(),
        ['name.first.', '.name.nickname.', 'likes']
      );
      // Then
      expect(result).toEqual({
        name: {
          First: first,
          Nickname: nickname,
        },
        age,
        Likes: likes,
      });
    });

    it('should exclude some keys when transforming them', () => {
      // Given
      const first = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const likes = 'ice-cream';
      const target = {
        name: {
          first,
          nickname,
        },
        age,
        likes,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase(),
        [],
        ['name.first', 'likes']
      );
      // Then
      expect(result).toEqual({
        Name: {
          first,
          Nickname: nickname,
        },
        Age: age,
        likes,
      });
    });

    it('should exclude some keys when transforming them (incomplete paths)', () => {
      // Given
      const first = 'Rosario';
      const nickname = 'Charito';
      const age = 3;
      const likes = 'ice-cream';
      const target = {
        name: {
          first,
          nickname,
        },
        age,
        likes,
      };
      let result = null;
      // When
      result = ObjectUtils.formatKeys(
        target,
        /^\w/,
        (letter) => letter.toUpperCase(),
        [],
        ['name.first.', '.name.nickname.', '.likes']
      );
      // Then
      expect(result).toEqual({
        Name: {
          first,
          nickname,
        },
        Age: age,
        likes,
      });
    });
  });

  describe('lowerCamelToSnakeKeys', () => {
    it('should transform all keys to snake case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        firstName,
        nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToSnakeKeys(target);
      // Then
      expect(result).toEqual({
        first_name: firstName,
        nick_name: nickName,
      });
    });

    it('should transform specific keys to snake case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          firstName,
          nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToSnakeKeys(target, ['name.firstName']);
      // Then
      expect(result).toEqual({
        name: {
          first_name: firstName,
          nickName,
        },
      });
    });

    it('should transform all keys to snake case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        nameInfo: {
          firstName,
          nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToSnakeKeys(target, [], ['nameInfo.firstName']);
      // Then
      expect(result).toEqual({
        name_info: {
          firstName,
          nick_name: nickName,
        },
      });
    });
  });

  describe('lowerCamelToDashKeys', () => {
    it('should transform all keys to dash case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        firstName,
        nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToDashKeys(target);
      // Then
      expect(result).toEqual({
        'first-name': firstName,
        'nick-name': nickName,
      });
    });

    it('should transform specific keys to dash case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          firstName,
          nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToDashKeys(target, ['name.firstName']);
      // Then
      expect(result).toEqual({
        name: {
          'first-name': firstName,
          nickName,
        },
      });
    });

    it('should transform all keys to dash case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        nameInfo: {
          firstName,
          nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.lowerCamelToDashKeys(target, [], ['nameInfo.firstName']);
      // Then
      expect(result).toEqual({
        'name-info': {
          firstName,
          'nick-name': nickName,
        },
      });
    });
  });

  describe('snakeToLowerCamelKeys', () => {
    it('should transform all keys to lower camel case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        first_name: firstName,
        nick_name: nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToLowerCamelKeys(target);
      // Then
      expect(result).toEqual({
        firstName,
        nickName,
      });
    });

    it('should transform specific keys to lower camel case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          first_name: firstName,
          nick_name: nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToLowerCamelKeys(target, ['name.first_name']);
      // Then
      expect(result).toEqual({
        name: {
          firstName,
          nick_name: nickName,
        },
      });
    });

    it('should transform all keys to lower camel case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name_info: {
          first_name: firstName,
          nick_name: nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToLowerCamelKeys(target, [], ['name_info.first_name']);
      // Then
      expect(result).toEqual({
        nameInfo: {
          first_name: firstName,
          nickName,
        },
      });
    });
  });

  describe('snakeToDashKeys', () => {
    it('should transform all keys to dash case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        first_name: firstName,
        nick_name: nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToDashKeys(target);
      // Then
      expect(result).toEqual({
        'first-name': firstName,
        'nick-name': nickName,
      });
    });

    it('should transform specific keys to dash case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          first_name: firstName,
          nick_name: nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToDashKeys(target, ['name.first_name']);
      // Then
      expect(result).toEqual({
        name: {
          'first-name': firstName,
          nick_name: nickName,
        },
      });
    });

    it('should transform all keys to dash case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name_info: {
          first_name: firstName,
          nick_name: nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.snakeToDashKeys(target, [], ['name_info.first_name']);
      // Then
      expect(result).toEqual({
        'name-info': {
          first_name: firstName,
          'nick-name': nickName,
        },
      });
    });
  });

  describe('dashToLowerCamelKeys', () => {
    it('should transform all keys to lower camel case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        'first-name': firstName,
        'nick-name': nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.dashToLowerCamelKeys(target);
      // Then
      expect(result).toEqual({
        firstName,
        nickName,
      });
    });

    it('should transform specific keys to lower camel case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          'first-name': firstName,
          'nick-name': nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.dashToLowerCamelKeys(target, ['name.first-name']);
      // Then
      expect(result).toEqual({
        name: {
          firstName,
          'nick-name': nickName,
        },
      });
    });

    it('should transform all keys to lower camel case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        'name-info': {
          'first-name': firstName,
          'nick-name': nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.dashToLowerCamelKeys(target, [], ['name-info.first-name']);
      // Then
      expect(result).toEqual({
        nameInfo: {
          'first-name': firstName,
          nickName,
        },
      });
    });
  });

  describe('dashToSnakeKeys', () => {
    it('should transform all keys to snake case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        'first-name': firstName,
        'nick-name': nickName,
      };
      let result = null;
      // When
      result = ObjectUtils.dashToSnakeKeys(target);
      // Then
      expect(result).toEqual({
        first_name: firstName,
        nick_name: nickName,
      });
    });

    it('should transform specific keys to snake case', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        name: {
          'first-name': firstName,
          'nick-name': nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.dashToSnakeKeys(target, ['name.first-name']);
      // Then
      expect(result).toEqual({
        name: {
          first_name: firstName,
          'nick-name': nickName,
        },
      });
    });

    it('should transform all keys to snake case except one', () => {
      // Given
      const firstName = 'Rosario';
      const nickName = 'Charito';
      const target = {
        'name-info': {
          'first-name': firstName,
          'nick-name': nickName,
        },
      };
      let result = null;
      // When
      result = ObjectUtils.dashToSnakeKeys(target, [], ['name-info.first-name']);
      // Then
      expect(result).toEqual({
        name_info: {
          'first-name': firstName,
          nick_name: nickName,
        },
      });
    });
  });
});
