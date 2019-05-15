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
});
