import { ResourceFormatter } from './formatter'
import { optionalStringAttribute } from '../test/fields'
import { ResourceIdentifier } from './resource/identifier'
import { Attribute } from './resource/field/attribute'
import { string } from './util/validators'
import { Relationship, RelationshipField } from './resource/field/relationship'

describe('ResourceFormatter', () => {
  describe('constructor', () => {
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

  describe('type', () => {
    it('equals the type param provided to the constructor', () => {
      const formatter = new ResourceFormatter('foo', {})
      expect(formatter.type).toBe('foo')
    })
  })

  describe('fields', () => {
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

  describe('identifier', () => {
    it('returns a resource identifier from the id param and instance type', () => {
      const formatter = new ResourceFormatter('foo', {})
      expect(formatter.identifier('<some-id>')).toEqual(new ResourceIdentifier('foo', '<some-id>'))
    })
  })

  describe('decode', () => {})

  describe('getField', () => {
    it('returns a field if it exists', () => {
      const formatter = new ResourceFormatter('foo', {
        a: Attribute.required(string),
      })

      const field = formatter.getField('a')

      expect(field).toBeTruthy()
      expect(field).toBe(formatter.fields.a)
    })

    it('throws if a field does not exist', () => {
      const formatter = new ResourceFormatter('foo', {})

      expect(() => formatter.getField('x' as never)).toThrow()
    })
  })

  describe('getAttributeField', () => {
    it('returns an attribute field if it exists', () => {
      const formatter = new ResourceFormatter('foo', {
        a: Attribute.required(string),
      })

      const field = formatter.getAttributeField('a')

      expect(field).toBeTruthy()
      expect(field).toBe(formatter.fields.a)
    })

    it('throws if a field does not exist', () => {
      const formatter = new ResourceFormatter('foo', {})

      expect(() => formatter.getAttributeField('x' as never)).toThrow()
    })

    it('throws if a field is not an attribute field', () => {
      const formatter: any = new ResourceFormatter('foo', {
        a: Relationship.toMany(() => formatter),
      })

      expect(() => formatter.getAttributeField('a' as never)).toThrow()
    })
  })

  describe('getRelationshipField', () => {
    it('returns a relationship field if it exists', () => {
      const formatter: any = new ResourceFormatter('foo', {
        a: Relationship.toOne(() => formatter),
      })

      const field = formatter.getRelationshipField('a')

      expect(field).toBeTruthy()
      expect(field).toBe(formatter.fields.a)
    })

    it('throws if a field does not exist', () => {
      const formatter = new ResourceFormatter('foo', {})

      expect(() => formatter.getRelationshipField('x' as never)).toThrow()
    })

    it('throws if a field is not a relationship field', () => {
      const formatter: any = new ResourceFormatter('foo', {
        a: Attribute.required(string),
      })

      expect(() => formatter.getRelationshipField('a' as never)).toThrow()
    })
  })
})
