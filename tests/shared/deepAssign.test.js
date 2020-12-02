jest.unmock('../../shared/deepAssign');
const {
  DeepAssign,
  deepAssign,
  deepAssignWithConcat,
  deepAssignWithOverwrite,
  deepAssignWithShallowMerge,
} = require('../../shared/deepAssign');

describe('DeepAssign', () => {
  it('should throw an error when instantiated with an invalid `arrayMode` option', () => {
    expect(() => new DeepAssign({ arrayMode: 'invalid' })).toThrow(/Invalid array mode/);
  });

  it('should return an empty object when assign is called without targets', () => {
    // Given
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign();
    result = sut.assign();
    // Then
    expect(sut).toBeInstanceOf(DeepAssign);
    expect(sut.options).toEqual({
      arrayMode: 'merge',
    });
    expect(result).toEqual({});
  });

  it('should merge two objects', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
    };
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge on top of an object with an undefined property', () => {
    // Given
    let undefinedOnA;
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
      undefinedOnA,
    };
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge an object with an undefined property', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: null,
    };
    let undefinedOnB;
    const targetB = {
      b: 'X',
      c: 'C',
      e: null,
      undefinedOnB,
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two objects with symbols as keys', () => {
    // Given
    const keyOne = Symbol('key 1');
    const keyTwo = Symbol('key 2');
    const targetA = {
      a: 'A',
      b: 'B',
      [keyOne]: {
        d: 'D',
        [keyTwo]: {
          f: 'F',
        },
      },
      [keyTwo]: 'E',
    };
    const targetB = {
      b: 'X',
      c: 'C',
      [keyOne]: {
        dd: 'DD',
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      [keyOne]: {
        d: 'D',
        dd: 'DD',
        [keyTwo]: {
          f: 'F',
        },
      },
      [keyTwo]: 'E',
    });
  });

  it('should remove the reference from the base objects', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
    };
    const changes = {
      a: 'A1',
      b: 'B1',
      c: 'C1',
    };
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    Object.keys(changes).forEach((key) => {
      result[key] = changes[key];
    });
    // Then
    expect(result).toEqual(changes);
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
    });
  });

  it('should merge a sub object from the second target without leaving references', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: {
        e: 'E',
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    result.d.e = 'X';
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      d: {
        e: 'X',
      },
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
      d: {
        e: 'E',
      },
    });
  });

  it('should merge sub objects without leaving references', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: {
        e: {
          f: 'F',
          g: {
            h: 'H',
          },
        },
      },
      j: {
        k: 'K',
      },
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          i: 'I',
        },
      },
    };
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    result.a = 'X';
    result.d.e.f = 'X';
    result.j.k = 'X';
    // Then
    expect(result).toEqual({
      a: 'X',
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          g: {
            h: 'H',
          },
          i: 'I',
        },
      },
      j: {
        k: 'X',
      },
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
      d: {
        e: {
          f: 'F',
          g: {
            h: 'H',
          },
        },
      },
      j: {
        k: 'K',
      },
    });
    expect(targetB).toEqual({
      b: 'X',
      c: 'C',
      d: {
        e: {
          f: 'X',
          i: 'I',
        },
      },
    });
  });

  it('should ignore a non-object and non-array item', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
    };
    const targetB = {
      b: 'X',
      c: 'C',
    };
    const targetC = 'Batman';
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB, targetC);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge arrays inside an object without concatenation', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
      d: ['D', 'XE', 'F'],
    };
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two arrays', () => {
    // Given
    const targetA = [{ A: 'A' }, 'E', 'F'];
    const targetB = [{ B: 'B' }, 'XE'];
    let sut = null;
    let result = null;
    const expected = [{ A: 'A', B: 'B' }, 'XE', 'F'];
    // When
    sut = new DeepAssign();
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should do a shallow merge of two arrays', () => {
    // Given
    const targetA = [{ A: 'A' }, 'E', 'F'];
    const targetB = [{ B: 'B' }, 'XE'];
    let sut = null;
    let result = null;
    const expected = [{ B: 'B' }, 'XE', 'F'];
    // When
    sut = new DeepAssign({
      arrayMode: 'shallowMerge',
    });
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge two arrays with the `merge` mode even if other one is specified', () => {
    // Given
    const targetA = ['D', 'E', 'F'];
    const targetB = ['D', 'XE'];
    let sut = null;
    let result = null;
    const expected = ['D', 'XE', 'F'];
    // When
    sut = new DeepAssign({ arrayMode: 'concat' });
    result = sut.assign(targetA, targetB);
    // Then
    expect(result).toEqual(expected);
  });

  it('should merge arrays inside an object by concatenating them', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
      d: [...targetA.d, ...targetB.d],
    };
    // When
    sut = new DeepAssign({
      arrayMode: 'concat',
    });
    result = sut.assign(targetA, targetB);
    // Then
    expect(sut.options).toEqual({
      arrayMode: 'concat',
    });
    expect(result).toEqual(expected);
  });

  it('should overwrite an array inside an object', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: ['D', 'E', 'F'],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', 'XE'],
    };
    let sut = null;
    let result = null;
    const expected = {
      ...targetA,
      ...targetB,
    };
    // When
    sut = new DeepAssign({
      arrayMode: 'overwrite',
    });
    result = sut.assign(targetA, targetB);
    // Then
    expect(sut.options).toEqual({
      arrayMode: 'overwrite',
    });
    expect(result).toEqual(expected);
  });

  it('should merge arrays with objects inside', () => {
    // Given
    const targetA = {
      a: 'A',
      b: 'B',
      d: [
        { d: 'D' },
        { e: 'E', eee: 'EEE' },
        'F',
        [
          {
            g: 'G',
            h: ['i'],
          },
        ],
      ],
    };
    const targetB = {
      b: 'X',
      c: 'C',
      d: ['D', { e: 'X', ee: 'XX' }],
    };
    let sut = null;
    let result = null;
    // When
    sut = new DeepAssign({
      concatArrays: false,
    });
    result = sut.assign(targetA, targetB);
    targetA.d.push('taE');
    targetA.d[0].tE = 'taE';
    targetA.d[3].push('taG');
    targetA.d[3][0].taI = 'taI';
    targetA.d[3][0].h.push('taI');
    result.d[0] = 'DD';
    result.d[3].push('gg');
    result.d[3][0].h.push('ii');
    // Then
    expect(result).toEqual({
      a: 'A',
      b: 'X',
      c: 'C',
      d: [
        'DD',
        {
          e: 'X',
          ee: 'XX',
          eee: 'EEE',
        },
        'F',
        [
          {
            g: 'G',
            h: ['i', 'ii'],
          },
          'gg',
        ],
      ],
    });
    expect(targetA).toEqual({
      a: 'A',
      b: 'B',
      d: [
        { d: 'D', tE: 'taE' },
        { e: 'E', eee: 'EEE' },
        'F',
        [
          {
            g: 'G',
            h: ['i', 'taI'],
            taI: 'taI',
          },
          'taG',
        ],
        'taE',
      ],
    });
  });

  describe('functions', () => {
    it('should have a function to call assign without an instance', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
      };
      const targetB = {
        b: 'X',
        c: 'C',
      };
      let result = null;
      const expected = {
        ...targetA,
        ...targetB,
      };
      // When
      result = deepAssign(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });

    it('should have a function to merge arrays without concatenation', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      let result = null;
      const expected = {
        ...targetA,
        ...targetB,
        d: ['D', 'XE', 'F'],
      };
      // When
      result = deepAssign(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });

    it('should have a function to merge arrays with concatenation', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      let result = null;
      const expected = {
        ...targetA,
        ...targetB,
        d: [...targetA.d, ...targetB.d],
      };
      // When
      result = deepAssignWithConcat(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });

    it('should have a function to merge with arrays overwrite', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: ['D', 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: ['D', 'XE'],
      };
      let result = null;
      const expected = {
        ...targetA,
        ...targetB,
      };
      // When
      result = deepAssignWithOverwrite(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });

    it('should have a function to do a shallow merge of two arrays', () => {
      // Given
      const targetA = {
        a: 'A',
        b: 'B',
        d: [{ D: 'D' }, 'E', 'F'],
      };
      const targetB = {
        b: 'X',
        c: 'C',
        d: [{ DX: 'DX' }, 'XE'],
      };
      let result = null;
      const expected = {
        ...targetA,
        ...targetB,
        d: [{ DX: 'DX' }, 'XE', 'F'],
      };
      // When
      result = deepAssignWithShallowMerge(targetA, targetB);
      // Then
      expect(result).toEqual(expected);
    });
  });
});
