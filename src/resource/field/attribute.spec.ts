import { requiredFieldFlag, identityFormatter, optionalFieldFlag } from '../../../test/fields'

import { ResourceFieldRoot } from '../../data/enum'
import { Attribute, AttributeField } from './attribute'
import { string } from '../../util/validators'

describe('AttributeField', () => {
  it('is an AttributeField constructor', () => {
    const attributeField = new AttributeField(requiredFieldFlag, string, identityFormatter)
    expect(attributeField).toBeInstanceOf(AttributeField)
  })

  describe('#root', () => {
    it('equals ResourceFieldRoot.Attributes', () => {
      const attributeField = new AttributeField(requiredFieldFlag, string, identityFormatter)
      expect(attributeField.root).toBe(ResourceFieldRoot.Attributes)
    })
  })

  describe('#flag', () => {
    it('equals its flag parameter', () => {
      const attributeField = new AttributeField(requiredFieldFlag, string, identityFormatter)
      expect(attributeField.flag).toBe(requiredFieldFlag)
    })
  })
})

describe('createAttributeFieldFactory', () => {
  it.todo('returns a AttributeField factory')
})

describe('Attribute', () => {
  describe('optional', () => {
    it('creates an optional AttributeField', () => {
      const optionalAttributeField = Attribute.optional(string)

      expect(optionalAttributeField.flag).toBe(optionalFieldFlag)
      expect(optionalAttributeField.validate('abc')).toEqual([])
      expect(optionalAttributeField.validate(null)).toEqual(['Value must be a string'])
    })
  })

  describe('required', () => {
    it('creates a required AttributeField', () => {
      const requiredAttributeField = Attribute.required(string)

      expect(requiredAttributeField.flag).toBe(requiredFieldFlag)
      expect(requiredAttributeField.validate('abc')).toEqual([])
      expect(requiredAttributeField.validate(null)).toEqual(['Value must be a string'])
    })
  })
})
