const extend = require('extend');
/**
 * A small collection of utility methods to work with objects.
 */
class ObjectUtils {
  /**
   * @throws {Error} is called. This class is meant to be have only static methods.
   * @ignore
   */
  constructor() {
    throw new Error('ObjectUtils is a static class');
  }
  /**
   * This method makes a deep merge of a list of objects into a new one.
   * @example
   * const objA = { a: 'first' };
   * const objB = { b: 'second' };
   * console.log(ObjectUtils.merge(objA, objB));
   * // Will output { a: 'first', b: 'second' }
   * @param {...{Object}} targets The objects to merge.
   * @return {Object}
   */
  static merge(...targets) {
    return extend(true, {}, ...targets);
  }
  /**
   * Creates a deep copy of a given object.
   * @param {Object} target The object to copy.
   * @return {Object}
   */
  static copy(target) {
    return this.merge(target);
  }
  /**
   * Returns the value of an object property using a path.
   * @example
   * const obj = {
   *   propOne: {
   *     propOneSub: 'Charito!',
   *   },
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.get(
   *   obj,
   *   'propOne.propOneSub'
   * ));
   * // Will output 'Charito!'
   *
   * @param {Object}  target                The object from where the property will be read.
   * @param {string}  objPath               The path to the property.
   * @param {string}  [pathDelimiter='.']   The delimiter that will separate the path components.
   * @param {boolean} [failWithError=false] Whether or not to throw an error when the path is
   *                                        invalid. If this is `false`, the method will silently
   *                                        fail and return `undefined`.
   * @return {*}
   * @throws {Error} If the path is invalid and `failWithError` is set to `true`.
   */
  static get(target, objPath, pathDelimiter = '.', failWithError = false) {
    const parts = objPath.split(pathDelimiter);
    const first = parts.shift();
    let currentElement = target[first];
    if (typeof currentElement === 'undefined') {
      if (failWithError) {
        throw new Error(`There's nothing on '${objPath}'`);
      }
    } else if (parts.length) {
      let currentPath = first;
      parts.some((currentPart) => {
        let breakLoop = false;
        currentPath += `${pathDelimiter}${currentPart}`;
        currentElement = currentElement[currentPart];
        if (typeof currentElement === 'undefined') {
          if (failWithError) {
            throw new Error(`There's nothing on '${currentPath}'`);
          } else {
            breakLoop = true;
          }
        }

        return breakLoop;
      });
    }

    return currentElement;
  }
  /**
   * Sets a property on an object using a path. If the path doesn't exist, it will be created.
   * @example
   * const target = {};
   * console.log(ObjectUtils.set(target, 'some.prop.path', 'some-value'));
   * // Will output { some: { prop: { path: 'some-value' } } }
   *
   * @param {Object}  target                The object where the property will be set.
   * @param {string}  objPath               The path for the property.
   * @param {*}       value                 The value to set on the property.
   * @param {string}  [pathDelimiter='.']   The delimiter that will separate the path components.
   * @param {boolean} [failWithError=false] Whether or not to throw an error when the path is
   *                                        invalid. If this is `false`, the method will silently
   *                                        fail and return `undefined`.
   * @return {Object} A copy of the original object with the added property/properties.
   * @throws {Error} If one of the path components is for a non-object property and
   *                 `failWithError` is set to `true`.
   */
  static set(
    target,
    objPath,
    value,
    pathDelimiter = '.',
    failWithError = false
  ) {
    let result = this.copy(target);
    if (objPath.includes(pathDelimiter)) {
      const parts = objPath.split(pathDelimiter);
      const last = parts.pop();
      let currentElement = result;
      let currentPath = '';
      parts.forEach((part) => {
        currentPath += `${pathDelimiter}${part}`;
        const element = currentElement[part];
        const elementType = typeof element;
        if (elementType === 'undefined') {
          currentElement[part] = {};
          currentElement = currentElement[part];
        } else if (elementType === 'object') {
          currentElement = currentElement[part];
        } else {
          const errorPath = currentPath.substr(pathDelimiter.length);
          if (failWithError) {
            throw new Error(
              `There's already an element of type '${elementType}' on '${errorPath}'`
            );
          } else {
            result = undefined;
          }
        }
      });

      if (result) {
        currentElement[last] = value;
      }
    } else {
      result[objPath] = value;
    }

    return result;
  }
  /**
   * Extracts a property or properties from an object in order to create a new one.
   * @example
   * const target = {
   *   name: {
   *     first: 'Rosario',
   *   },
   *   age: 3,
   *   address: {
   *     planet: 'earth',
   *     something: 'else',
   *   },
   * };
   * console.log(ObjectUtils.set(obj, [
   *   { 'name': 'name.first'},
   *   'age',
   *   'address.planet'
   * ]));
   * // Will output { name: 'Rosario', age: 3, address: { planet: 'earth' } }
   * @param {Object}              target                The object from where the
   *                                                    property/properties will be extracted.
   * @param {Array|Object|string} objPaths              This can be a single path or a list of
   *                                                    them. And for this method, the paths are
   *                                                    not only strings but can also be an object
   *                                                    with a single key, the would be the path
   *                                                    to where to "do the extraction", and the
   *                                                    value the path on the target object.
   * @param {string}              [pathDelimiter='.']   The delimiter that will separate the
   *                                                    path components.
   * @param {boolean}             [failWithError=false] Whether or not to throw an error when the
   *                                                    path is invalid. If this is `false`, the
   *                                                    method will silently fail an empty object.
   * @return {Object}
   */
  static extract(target, objPaths, pathDelimiter = '.', failWithError = false) {
    const copied = this.copy(target);
    let result = {};
    (Array.isArray(objPaths) ? objPaths : [objPaths])
    .reduce((acc, objPath) => {
      let destPath;
      let originPath;
      if (typeof objPath === 'object') {
        [destPath] = Object.keys(objPath);
        originPath = objPath[destPath];
      } else {
        destPath = objPath;
        originPath = objPath;
      }

      return [...acc, {
        origin: originPath,
        customDest: destPath.includes(pathDelimiter),
        dest: destPath,
      }];
    }, [])
    .some((pathInfo) => {
      let breakLoop = false;
      const value = this.get(copied, pathInfo.origin, pathDelimiter, failWithError);
      if (typeof value !== 'undefined') {
        if (pathInfo.customDest) {
          result = this.set(result, pathInfo.dest, value, pathDelimiter, failWithError);
          if (typeof result === 'undefined') {
            breakLoop = true;
          }
        } else {
          result[pathInfo.dest] = value;
        }
      }

      return breakLoop;
    });

    return result;
  }
  /**
   * Deletes a property of an object using a path.
   * @example
   * const target = {
   *   propOne: {
   *     propOneSub: 'Charito!',
   *   },
   *   propTwo: '!!!',
   * };
   * console.log(ObjectUtils.delete(
   *   target,
   *   'propOne.propOneSub'
   * ));
   * // Will output { propTwo: '!!!' }
   *
   * @param {Object}  target                      The object from where the property will be
   *                                              removed.
   * @param {string}  objPath                     The path to the property.
   * @param {String}  [pathDelimiter='.']         The delimiter that will separate the path
   *                                              components.
   * @param {Boolean} [cleanEmptyProperties=true] If this flag is `true` and after removing the
   *                                              property the parent object is empty, it will
   *                                              remove it recursively until a non empty parent
   *                                              object is found.
   * @param {boolean} [failWithError=false]       Whether or not to throw an error when the path
   *                                              is invalid. If this is `false`, the method will
   *                                              silently fail.
   * @return {Object} A copy of the original object with the removed property/properties.
   */
  static delete(
    target,
    objPath,
    pathDelimiter = '.',
    cleanEmptyProperties = true,
    failWithError = false
  ) {
    const parts = objPath.split(pathDelimiter);
    const last = parts.pop();
    let result = this.copy(target);
    if (parts.length) {
      const parentPath = parts.join(pathDelimiter);
      const parentObj = this.get(
        result,
        parentPath,
        pathDelimiter,
        failWithError
      );
      delete parentObj[last];
      if (cleanEmptyProperties && !Object.keys(parentObj).length) {
        result = this.delete(
          result,
          parentPath,
          pathDelimiter,
          cleanEmptyProperties,
          failWithError
        );
      }
    } else {
      delete result[last];
    }

    return result;
  }
}

module.exports = ObjectUtils;
