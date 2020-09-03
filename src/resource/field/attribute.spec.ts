import { isString } from 'isntnt'

import { ResourceFieldFlag, ResourceFieldRoot } from '../../enum'
import { Type } from '../../type'
import { Attribute, AttributeField } from './attribute'

const ATTRIBUTE_FIELD_FLAG =
  ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.AlwaysPatch | ResourceFieldFlag.AlwaysPost

const STRING_VALIDATOR = Type.is('a string', isString)
const FORMATTER = {
  deserialize: (value: any) => value,
  serialize: (value: any) => value,
}

describe('AttributeField', () => {
  it('is an AttributeField constructor that', () => {
    const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
    expect(attributeField).toBeInstanceOf(AttributeField)
  })

  describe('#root', () => {
    it('equals ResourceFieldRoot.Attributes', () => {
      const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
      expect(attributeField.root).toBe(ResourceFieldRoot.Attributes)
    })
  })

  describe('#flag', () => {
    it('equals its flag parameter', () => {
      const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
      expect(attributeField.flag).toBe(ATTRIBUTE_FIELD_FLAG)
    })
  })

  // describe('#predicate', () => {
  //   it('equals the its validator parameter predicate property', () => {
  //     const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
  //     expect(attributeField.predicate).toBe(STRING_VALIDATOR.predicate)
  //   })
  // })

  // describe('#validate', () => {
  //   it('equals the its validator parameter validate property', () => {
  //     const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
  //     expect(attributeField.validate).toBe(STRING_VALIDATOR.validate)
  //   })
  // })

  // describe('#deserialize', () => {
  //   it('equals the its formatter parameter deserialize property', () => {
  //     const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
  //     expect(attributeField.deserialize).toBe(FORMATTER.deserialize)
  //   })
  // })

  // describe('#serialize', () => {
  //   it('equals the its formatter parameter serialize property', () => {
  //     const attributeField = new AttributeField(ATTRIBUTE_FIELD_FLAG, STRING_VALIDATOR, FORMATTER)
  //     expect(attributeField.serialize).toBe(FORMATTER.serialize)
  //   })
  // })
})

describe('createAttributeFieldFactory', () => {
  it.todo('is a function')

  it.todo('returns a function')
})

describe('Attribute', () => {
  describe('optional', () => {
    it('creates an optional AttributeField', () => {
      const optionalAttributeField = Attribute.optional(STRING_VALIDATOR)

      expect(optionalAttributeField.flag).toBe(
        ResourceFieldFlag.MaybeGet | ResourceFieldFlag.MaybePost | ResourceFieldFlag.MaybePatch,
      )

      expect(optionalAttributeField.validate('abc')).toEqual([])
      expect(optionalAttributeField.validate(null)).toEqual(['Value must be a string'])
    })
  })

  describe('required', () => {
    it('creates a required AttributeField', () => {
      const requiredAttributeField = Attribute.required(STRING_VALIDATOR)

      expect(requiredAttributeField.flag).toBe(
        ResourceFieldFlag.AlwaysGet | ResourceFieldFlag.AlwaysPost | ResourceFieldFlag.MaybePatch,
      )

      expect(requiredAttributeField.validate('abc')).toEqual([])
      expect(requiredAttributeField.validate(null)).toEqual(['Value must be a string'])
    })
  })
})
