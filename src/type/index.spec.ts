import { isAny, isNever, isString } from 'isntnt'

import Type from '.'

describe('Type', () => {
  describe('#constructor', () => {
    it('must set its given description as its description member', () => {
      const any = Type.is('any', isAny)
      expect(any.description).toBe('any')
    })

    it('must set its given predicate as its predicate member', () => {
      const any = Type.is('any', isAny)
      expect(any.predicate).toBe(isAny)
    })
  })

  describe('#code', () => {
    it('must have a default value of null', () => {
      const any = Type.is('any', isAny)
      expect(any.code).toBe(null)
    })
  })

  describe('#pointer', () => {
    it('must have an empty Array as its default value', () => {
      const any = Type.is('any', isAny)
      expect(any.pointer).toEqual([])
    })
  })

  describe('#rules', () => {
    it('must have an empty Array as its default value', () => {
      const any = Type.is('any', isAny)
      expect(any.rules).toEqual([])
    })
  })

  describe('#predicate', () => {
    it('must return true if the type predicate is met', () => {
      const any = Type.is('any', isAny)
      expect(any.predicate(null)).toBe(true)
    })

    it('must return false if the type predicate is not met', () => {
      const never = Type.is('never', isNever)
      expect(never.predicate(null)).toBe(false)
    })
  })

  describe('#assert', () => {
    it('must return the input value when it meets the type rules', () => {
      const any = Type.is('any', isAny)
      const value = {}
      expect(any.assert(value)).toBe(value)
    })

    it('must throw a TypeError when the input value does not meet the type rules', () => {
      const never = Type.is('never', isNever)
      expect(() => never.assert(null)).toThrowError(String(never))
    })
  })

  describe('#validate', () => {
    it('must return an empty Array if its input value meets the type rules', () => {
      const any = Type.is('any', isAny)
      expect(any.validate(null)).toEqual([])
    })

    it('must return an Array with error details if its input value does not meet the type rules', () => {
      const never = Type.is('never', isNever)
      const value = {}
      expect(never.validate(value)).toEqual([
        'value must be never',
        // {
        //   code: null,
        //   detail: 'value must be never',
        //   pointer: [],
        // },
      ])
    })
  })

  describe('#with', () => {
    it('must return a cloned instance of itself', () => {
      const any = Type.is('any', isAny)
      const anyClone = any.with({})
      expect(anyClone).toBeInstanceOf(Type)
      expect(anyClone).not.toBe(any)
      expect(anyClone).toEqual(any)
    })

    it('must assign the supplied meta values to its clone', () => {
      const any = Type.is('any', isAny)
      const meta = {
        code: 'some-code',
        description: 'some-description',
        pointer: ['some-property-name'],
        rules: [any],
      }
      const anyWithMeta = any.with(meta)
      expect(anyWithMeta.code).toBe(meta.code)
      expect(anyWithMeta.description).toBe(meta.description)
      expect(anyWithMeta.pointer).toBe(meta.pointer)
      expect(anyWithMeta.rules).toBe(meta.rules)
    })
  })

  describe('#withCode', () => {
    it('must return a cloned instance of itself where code equals its provided value', () => {
      const any = Type.is('any', isAny)
      const anyWithCode = any.withCode('some-code')
      expect(anyWithCode.code).toBe('some-code')
    })
  })

  describe('#withDescription', () => {
    it('must return a cloned instance of itself where description equals its provided value', () => {
      const any = Type.is('any', isAny)
      const anyWithDescription = any.withDescription('some-description')
      expect(anyWithDescription.description).toBe('some-description')
    })
  })

  describe('#withPointer', () => {
    it('must return a cloned instance of itself where pointer equals its provided value', () => {
      const any = Type.is('any', isAny)
      const pointer = ['some-property-name']
      const anyWithPointer = any.withPointer(pointer)
      expect(anyWithPointer.pointer).toBe(pointer)
      expect(anyWithPointer.pointer).toEqual(['some-property-name'])
    })
  })

  describe('#toString', () => {
    it('must return a detail string', () => {
      const any = Type.is('any', isAny)
      expect(any.toString()).toBe('value must be any')
    })

    it('must return a detail string including its pointer if present', () => {
      const any = Type.is('any', isAny).withPointer(['foo', 'bar'])
      expect(any.toString()).toBe('value at foo/bar must be any')
    })
  })

  describe('is', () => {
    it('must return an instance of Type', () => {
      const any = Type.is('any', isAny)
      expect(any).toBeInstanceOf(Type)
    })

    it('must have 0 rules', () => {
      const any = Type.is('any', isAny)
      expect(any.rules.length).toBe(0)
    })

    it('must format its detail using TypeVerb.Is', () => {
      const any = Type.is('any', isAny)
      expect(String(any)).toBe('value must be any')
    })
  })

  describe('at', () => {
    it('must return an instance of Type', () => {
      const any = Type.is('any', isAny)
      const anyAtAny = Type.at('any', any)
      expect(anyAtAny).toBeInstanceOf(Type)
    })

    it('must have 0 rules', () => {
      const any = Type.is('any', isAny)
      const anyAtAny = Type.at('any', any)
      expect(anyAtAny.rules.length).toBe(0)
    })

    it('must have a pointer that appends its given type pointer', () => {
      const any = Type.is('any', isAny)
      const anyAtAny = Type.at('any', any)
      expect(anyAtAny.pointer).toEqual(['any'])

      const anyWithPointerAtAny = Type.at('any', any.withPointer(['foo']))
      expect(anyWithPointerAtAny.pointer).toEqual(['foo', 'any'])
    })
  })

  describe('and', () => {
    it('must return an instance of Type', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const anyAndNever = Type.and([any, never])
      expect(anyAndNever).toBeInstanceOf(Type)
    })

    it('must throw an Error if no rules are provided', () => {
      expect(() => Type.and([])).toThrowError()
    })

    it('must return its given type unaffected if theres only 1', () => {
      const any = Type.is('any', isAny)
      const justAny = Type.and([any])
      expect(justAny).toBe(any)
    })

    it.todo('must flatten the rules of its given types')

    it.todo('must filter out duplicate rules')

    it('must have as many rules as its given types', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const anyAndNever = Type.and([any, never])
      expect(anyAndNever.rules.length).toBe(2)
    })

    describe('#predicate', () => {
      it('must return true if each of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(anyAndString.predicate('ABC')).toBe(true)
      })

      it('must return false if some of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(anyAndString.predicate(12)).toBe(false)
      })

      it('must return false if none of its rules evaluate to true', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const neverAndString = Type.and([never, string])
        expect(neverAndString.predicate(12)).toBe(false)
      })
    })

    describe('#assert', () => {
      it('must return the input value when it meets the type rules', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(anyAndString.assert('ABC')).toBe('ABC')
      })

      it('must throw a TypeError when the input value does not meet the type rules', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(() => anyAndString.assert(12)).toThrowError(String(anyAndString))
      })
    })

    describe('#validate', () => {
      it('must return an empty Array if each of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(anyAndString.validate('ABC')).toEqual([])
      })

      it('must return an Array with a single error detail if one of its rules evaluates to false', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([never, string])
        expect(anyAndString.validate('ABC')).toEqual([
          'value must be never',
          // {
          //   code: null,
          //   detail: 'value must be never',
          //   pointer: [],
          // },
        ])
      })

      it('must return an Array with an error detail for each rule if none of its rules evaluates to true', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([never, string])
        expect(anyAndString.validate(12)).toEqual([
          'value must be never',
          'value must be a string',
          // {
          //   code: null,
          //   detail: 'value must be never',
          //   pointer: [],
          // },
          // {
          //   code: null,
          //   detail: 'value must be a string',
          //   pointer: [],
          // },
        ])
      })
    })

    describe('#toString', () => {
      it('must return a formatted  rules detail', () => {
        const any = Type.is('any', isAny)
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const anyAndString = Type.and([any, string])
        expect(anyAndString.toString()).toBe('value must be any and a string')

        const anyAndNeverAndString = Type.and([any, never, string])
        expect(anyAndNeverAndString.toString()).toBe('value must be any, never, and a string')

        const neverAndAnyAndString = Type.and([never, anyAndString])
        expect(neverAndAnyAndString.toString()).toBe('value must be never, any, and a string')
      })

      it.todo('must properly format rules with mixed type modes')
    })
  })

  describe('or', () => {
    it('must return an instance of Type', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const anyOrNever = Type.or([any, never])
      expect(anyOrNever).toBeInstanceOf(Type)
    })

    it('must throw an Error if no rules are provided', () => {
      expect(() => Type.or([])).toThrowError()
    })

    it('must return its given type unaffected if theres only 1', () => {
      const any = Type.is('any', isAny)
      const justAny = Type.or([any])
      expect(justAny).toBe(any)
    })

    it.todo('must flatten the rules of its given types')

    it.todo('must filter out duplicate rules')

    it('must have as many rules as its given types', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const anyOrNever = Type.or([any, never])
      expect(anyOrNever.rules.length).toBe(2)
    })

    it('must have as many rules as its given types', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const anyOrNever = Type.or([any, never])
      expect(anyOrNever.rules.length).toBe(2)
    })

    describe('#predicate', () => {
      it('must return true if each of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.predicate('ABC')).toBe(true)
      })

      it('must return true if some of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.predicate(12)).toBe(true)
      })

      it('must return false if none of its rules evaluate to true', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const neverOrString = Type.or([never, string])
        expect(neverOrString.predicate(12)).toBe(false)
      })
    })

    describe('#assert', () => {
      it('must return the input value when it meets the type rules', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.assert('ABC')).toBe('ABC')
      })

      it('must throw a TypeError when the input value does not meet the type rules', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const neverOrString = Type.or([never, string])
        expect(() => neverOrString.assert(12)).toThrowError(String(neverOrString))
      })
    })

    describe('#validate', () => {
      it('must return an empty Array if each of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.validate('ABC')).toEqual([])
      })

      it('must return an empty Array if some of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.validate(12)).toEqual([])
      })

      it('must return an Array with an error detail if none of its rules evaluate to true', () => {
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const neverOrString = Type.or([never, string])
        expect(neverOrString.validate(12)).toEqual([
          'value must be never or a string',
          // {
          //   code: null,
          //   detail: 'value must be never or a string',
          //   pointer: [],
          // },
        ])
      })
    })

    describe('#toString', () => {
      it('must return a formatted rules detail', () => {
        const any = Type.is('any', isAny)
        const never = Type.is('never', isNever)
        const string = Type.is('a string', isString)
        const anyOrString = Type.or([any, string])
        expect(anyOrString.toString()).toBe('value must be any or a string')

        const anyOrNeverOrString = Type.or([any, never, string])
        expect(anyOrNeverOrString.toString()).toBe('value must be any, never, or a string')

        const neverOrAnyOrString = Type.or([never, anyOrString])
        expect(neverOrAnyOrString.toString()).toBe('value must be never, any, or a string')
      })
    })

    it.todo('must properly format rules detail with mixed type modes')
  })

  describe('shape', () => {
    it('must return an instance of Type', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const shape = Type.shape('any object', {
        any,
        never,
      })
      expect(shape).toBeInstanceOf(Type)
    })

    it('must have as many rules as its amount of properties plus one', () => {
      const any = Type.is('any', isAny)
      const never = Type.is('never', isNever)
      const shape = Type.shape('a never object', {
        any,
        never,
      })
      expect(shape.rules.length).toBe(2 + 1)
    })

    describe('#predicate', () => {
      it('must return false if its given value is not object-like', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(anyShape.predicate(null)).toBe(false)
      })

      it('must return true if each value property matches its predicate', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(anyShape.predicate({ foo: 12, bar: null })).toBe(true)
      })

      it('must return false if some properties meet their predicate', () => {
        const any = Type.is('any', isAny)
        const never = Type.is('never', isNever)
        const anyAndNeverShape = Type.shape('an object without bar', {
          foo: any,
          bar: never,
        })
        expect(anyAndNeverShape.predicate({ foo: 12, bar: null })).toBe(false)
      })

      it('must return false if no property meets their predicate', () => {
        const never = Type.is('never', isNever)
        const neverShape = Type.shape('an object without foo or bar', {
          foo: never,
          bar: never,
        })
        expect(neverShape.predicate({ foo: 12, bar: null })).toBe(false)
      })
    })

    describe('#assert', () => {
      it('must return the input value when it meets the type rules', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        const value = {}
        expect(anyShape.assert(value)).toBe(value)
      })

      it('must throw a TypeError if its given value is not object-like', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(() => anyShape.assert(null)).toThrowError(String(anyShape))
      })

      it('must throw a TypeError if some properties meet their predicate', () => {
        const any = Type.is('any', isAny)
        const never = Type.is('never', isNever)
        const anyAndNeverShape = Type.shape('any object', {
          foo: any,
          bar: never,
        })
        expect(() => anyAndNeverShape.assert(12)).toThrowError(String(anyAndNeverShape))
      })

      it('must throw a TypeError if no properties meet their predicate', () => {
        const never = Type.is('never', isNever)
        const neverShape = Type.shape('an object without foo or bar', {
          foo: never,
          bar: never,
        })
        expect(() => neverShape.assert(12)).toThrowError(String(neverShape))
      })
    })

    describe('#validate', () => {
      it('must return an empty Array if each of its rules evaluate to true', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(anyShape.validate({})).toEqual([])
      })

      it('must return an Array with an error detail for each rule if its given value is not object-like', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(anyShape.validate(null)).toEqual([
          'value must be an object',
          'value at foo must be any',
          'value at bar must be any',
          // {
          //   code: null,
          //   detail: 'value must be an object',
          //   pointer: [],
          // },
          // {
          //   code: null,
          //   detail: 'value at foo must be any',
          //   pointer: ['foo'],
          // },
          // {
          //   code: null,
          //   detail: 'value at bar must be any',
          //   pointer: ['bar'],
          // },
        ])
      })

      it('must return an Array with a single error detail if one of its rules evaluates to false', () => {
        const any = Type.is('any', isAny)
        const never = Type.is('never', isNever)
        const anyAndNeverShape = Type.shape('an object without bar', {
          foo: any,
          bar: never,
        })
        expect(anyAndNeverShape.validate({})).toEqual([
          'value at bar must be never',
          // {
          //   code: null,
          //   detail: 'value at bar must be never',
          //   pointer: ['bar'],
          // },
        ])
      })

      it('must return an Array with an error detail for each rule if none of its rules evaluates to true', () => {
        const never = Type.is('never', isNever)
        const neverShape = Type.shape('an object without foo or bar', {
          foo: never,
          bar: never,
        })
        expect(neverShape.validate(12)).toEqual([
          'value at foo must be never',
          'value at bar must be never',
          // {
          //   code: null,
          //   detail: 'value at foo must be never',
          //   pointer: ['foo'],
          // },
          // {
          //   code: null,
          //   detail: 'value at bar must be never',
          //   pointer: ['bar'],
          // },
        ])
      })
    })

    describe('#toString', () => {
      it('must return a formatted rules detail', () => {
        const any = Type.is('any', isAny)
        const anyShape = Type.shape('any object', {
          foo: any,
          bar: any,
        })
        expect(anyShape.toString()).toBe('value must be any object')
      })
    })
  })
})
