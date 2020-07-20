import { isString, Predicate } from 'isntnt'

import { ResourceFieldFlag, ResourceFieldMethod } from '..'
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

      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Get)).toEqual([])
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Get)).toEqual([])
      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Post)).toEqual([])
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Post)).toEqual([])
      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Patch)).toEqual([])
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Patch)).toEqual([])
    })
  })

  describe('required', () => {
    it('creates a required AttributeField', () => {
      const requiredAttributeField = Attribute.required(string)

      expect(requiredAttributeField.flag).toBe(
        ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePatch,
      )

      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Get)).toEqual([])
      expect(requiredAttributeField.validate(null, ResourceFieldMethod.Get)).toEqual([
        'value is required',
      ])
      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Post)).toEqual([])
      expect(requiredAttributeField.validate(null, ResourceFieldMethod.Post)).toEqual([
        'value is required',
      ])
      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Patch)).toEqual([])
      expect(requiredAttributeField.validate(null, ResourceFieldMethod.Patch)).toEqual([])
    })
  })
})
