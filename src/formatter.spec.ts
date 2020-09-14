import { ResourceFormatter } from './formatter'
import { optionalStringAttribute } from '../test/fields'
import { ResourceIdentifier } from './resource/identifier'

describe('ResourceFormatter', () => {
  describe('#constructor', () => {
    it('throws if an invalid resource type is provided', () => {
      expect(() => new ResourceFormatter('', {})).toThrow()
      expect(() => new ResourceFormatter('_a', {})).toThrow()
      expect(() => new ResourceFormatter('_a_', {})).toThrow()
      expect(() => new ResourceFormatter('+', {})).toThrow()
      expect(() => new ResourceFormatter('a+a', {})).toThrow()
      expect(() => new ResourceFormatter(' ', {})).toThrow()
      expect(() => new ResourceFormatter('_', {})).toThrow()
      expect(() => new ResourceFormatter('-', {})).toThrow()
    })

    it('throws if an field with an invalid field name is provided', () => {
      expect(
        () =>
          new ResourceFormatter('type', {
            _: optionalStringAttribute,
          }),
      ).toThrow()
      expect(
        () =>
          new ResourceFormatter('type', {
            _foo: optionalStringAttribute,
          }),
      ).toThrow()
      expect(
        () =>
          new ResourceFormatter('type', {
            foo_: optionalStringAttribute,
          }),
      ).toThrow()
      expect(
        () =>
          new ResourceFormatter('type', {
            ['fo+o']: optionalStringAttribute,
          }),
      ).toThrow()
    })

    it('throws if an invalid field is provided', () => {
      expect(
        () =>
          new ResourceFormatter('type', {
            foo: {} as any,
          }),
      ).toThrow()
    })
  })

  describe('#type', () => {
    it('equals the type param provided to the constructor', () => {
      const formatter = new ResourceFormatter('foo', {})
      expect(formatter.type).toBe('foo')
    })
  })

  describe('#fields', () => {
    it('is an object without a prototype', () => {
      const formatter = new ResourceFormatter('foo', {
        bar: optionalStringAttribute,
      })
      expect(Object.getPrototypeOf(formatter.fields)).toBe(null)

      const fieldNames = []
      for (const fieldName in formatter.fields) {
        fieldNames.push(fieldName)
      }
      expect(fieldNames).toEqual(['bar'])
    })
  })

  describe('#identifier', () => {
    it('returns a resource identifier from the id param and instance type', () => {
      const formatter = new ResourceFormatter('foo', {})
      expect(formatter.identifier('<some-id>')).toEqual(new ResourceIdentifier('foo', '<some-id>'))
    })
  })
})

describe('decode', () => {})
