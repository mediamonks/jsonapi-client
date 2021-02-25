import { Attribute } from '../resource/field/attribute'
import { Type } from '../util/type'
import { string } from '../util/validators'
import { parseResourceFields } from './parseResourceFields'

describe('parseResourceFields', () => {
  it('returns a null prototype object', () => {
    const fields = parseResourceFields({})
    expect(Object.getPrototypeOf(fields)).toBe(null)
  })

  it('throws when "type" is used as a field name', () => {
    expect(() =>
      parseResourceFields({
        type: Attribute.optional(string),
      }),
    ).toThrow()

    try {
      parseResourceFields({
        type: Attribute.optional(string),
      })
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError)
      expect(error.message).toBe(
        'Value at type must be a valid resource type and a string other than "type" or "id"',
      )
    }
  })

  it('throws when "id" is used as a field name', () => {
    expect(() =>
      parseResourceFields({
        id: Attribute.optional(string),
      }),
    ).toThrow()

    try {
      parseResourceFields({
        id: Attribute.optional(string),
      })
    } catch (error) {
      expect(error).toBeInstanceOf(TypeError)
      expect(error.message).toBe(
        'Value at id must be a valid resource type and a string other than "type" or "id"',
      )
    }
  })
})
