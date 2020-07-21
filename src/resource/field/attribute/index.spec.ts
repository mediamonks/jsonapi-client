import { isString, Predicate } from 'isntnt'

import { ResourceFieldFlag } from '..'
import { Attribute } from '.'

const createValidator = <T>(description: string, predicate: Predicate<T>) => {
  return {
    predicate,
    validate(value: unknown): ReadonlyArray<string> {
      return predicate(value) ? [] : [`value must be ${description}`]
    },
  }
}

const string = createValidator('a string', isString)

describe('AttributeField', () => {
  it.todo('is an AttributeField constructor')

  it.todo('extends ResourceField')

  describe('#root', () => {
    it.todo('equals ResourceFieldRoot.Attributes')
  })
})

describe('createAttributeFieldFactory', () => {
  it.todo('is a function')

  it.todo('returns a function')
})

describe('Attribute', () => {
  describe('optional', () => {
    it('creates an optional AttributeField', () => {
      const optionalAttributeField = Attribute.optional(string)

      expect(optionalAttributeField.flag).toBe(
        ResourceFieldFlag.MaybeGet | ResourceFieldFlag.MaybePost | ResourceFieldFlag.MaybePatch,
      )

      expect(optionalAttributeField.validate('abc')).toEqual([])
      expect(optionalAttributeField.validate(null)).toEqual(['value must be a string'])
    })
  })

  describe('required', () => {
    it('creates a required AttributeField', () => {
      const requiredAttributeField = Attribute.required(string)

      expect(requiredAttributeField.flag).toBe(
        ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePatch,
      )

      expect(requiredAttributeField.validate('abc')).toEqual([])
      expect(requiredAttributeField.validate(null)).toEqual(['value must be a string'])
    })
  })
})
