import { decodeAttribute } from './decodeAttribute'
import { Attribute } from '../resource/field/attribute'
import { string } from '../util/validators'

const optionalAttribute = Attribute.optional(string)
const requiredAttribute = Attribute.required(string)

describe('decodeAttribute', () => {
  it('returns a Validation Array', () => {
    const validation = decodeAttribute(optionalAttribute, 'foo', { type: '<TYPE>', id: '<ID>' }, [])
    const [value, errors] = validation

    expect(validation).toBeInstanceOf(Array)
    expect(value).toBe(null)
    expect(errors).toBeInstanceOf(Array)
  })

  it('returns a success value when an optional attribute is not present', () => {
    const validation = decodeAttribute(optionalAttribute, 'foo', { type: '<TYPE>', id: '<ID>' }, [])
    const [value, errors] = validation

    expect(value).toBe(null)
    expect(errors.length).toBe(0)
  })

  it('returns a success value when an optional attribute is null', () => {
    const validation = decodeAttribute(
      optionalAttribute,
      'foo',
      {
        type: '<TYPE>',
        id: '<ID>',
        attributes: {
          foo: null,
        },
      },
      [],
    )
    const [value, errors] = validation

    expect(value).toBe(null)
    expect(errors.length).toBe(0)
  })

  it('returns a success value when an attribute matches its field type', () => {
    const validation = decodeAttribute(
      optionalAttribute,
      'foo',
      {
        type: '<TYPE>',
        id: '<ID>',
        attributes: {
          foo: 'abc',
        },
      },
      [],
    )
    const [value, errors] = validation

    expect(value).toBe('abc')
    expect(errors.length).toBe(0)
  })

  it('returns a failure error array when a required attribute is not present', () => {
    const validation = decodeAttribute(requiredAttribute, 'foo', { type: '<TYPE>', id: '<ID>' }, [])
    const [value, errors] = validation

    expect(value).toBe(null)
    expect(errors.length).toBe(1)
  })

  it('returns a failure error array when a required attribute is null', () => {
    const validation = decodeAttribute(
      requiredAttribute,
      'foo',
      {
        type: '<TYPE>',
        id: '<ID>',
        attributes: {
          foo: null,
        },
      },
      [],
    )
    const [value, errors] = validation

    expect(value).toBe(null)
    expect(errors.length).toBe(1)
  })

  it('returns a failure error array when an attribute does not match field its type', () => {
    const validation = decodeAttribute(
      optionalAttribute,
      'foo',
      {
        type: '<TYPE>',
        id: '<ID>',
        attributes: {
          foo: 12,
        },
      },
      [],
    )
    const [value, errors] = validation

    expect(value).toBe(null)
    expect(errors.length).toBe(1)
  })
})
