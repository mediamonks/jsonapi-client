import Attribute from './attribute'
import { isString } from 'isntnt'
import { ResourceFieldFlag, ResourceFieldMethod } from './field'

describe('Attribute', () => {
  describe('optional', () => {
    it('creates an optional AttributeField', () => {
      const optionalAttributeField = Attribute.optional(isString)

      expect(optionalAttributeField.flag).toBe(
        ResourceFieldFlag.MaybeGet | ResourceFieldFlag.MaybePost | ResourceFieldFlag.MaybePatch,
      )

      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Get)).toBe('abc')
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Get)).toBe(null)
      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Post)).toBe('abc')
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Post)).toBe(null)
      expect(optionalAttributeField.validate('abc', ResourceFieldMethod.Patch)).toBe('abc')
      expect(optionalAttributeField.validate(null, ResourceFieldMethod.Patch)).toBe(null)
    })
  })

  describe('required', () => {
    it('creates a required AttributeField', () => {
      const requiredAttributeField = Attribute.required(isString)

      expect(requiredAttributeField.flag).toBe(
        ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePatch,
      )

      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Get)).toBe('abc')
      expect(() => requiredAttributeField.validate(null, ResourceFieldMethod.Get)).toThrow()
      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Post)).toBe('abc')
      expect(() => requiredAttributeField.validate(null, ResourceFieldMethod.Post)).toThrow()
      expect(requiredAttributeField.validate('abc', ResourceFieldMethod.Patch)).toBe('abc')
      expect(requiredAttributeField.validate(null, ResourceFieldMethod.Patch)).toBe(null)
    })
  })
})
