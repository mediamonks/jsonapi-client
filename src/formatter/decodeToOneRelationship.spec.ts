import { formatterA } from '../../test/formatters'
import { ValidationErrorMessage } from '../data/enum'
import { Relationship } from '../resource/field/relationship'
import { decodeToOneRelationship } from './decodeToOneRelationship'

describe('decodeToOneRelationship', () => {
  it('returns success if every included resource is decoded without errors', () => {
    const toOneRelationshipField = Relationship.toOne(() => formatterA)
    const [value, errors] = decodeToOneRelationship(
      toOneRelationshipField,
      'toOneA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toOneA: {
            data: {
              type: 'a',
              id: 'a-id',
            },
          },
        },
      },
      [
        {
          type: 'a',
          id: 'a-id',
          attributes: {
            requiredString: 'test',
          },
        },
      ],
      {},
      {},
      {
        toOneA: null,
      },
      [],
    )

    expect(value).toEqual({
      type: 'a',
      id: 'a-id',
      requiredString: 'test',
      optionalString: null,
      toOneB: null,
      toManyA: [],
    })

    expect(errors.length).toBe(0)
  })

  it('returns failure validation if a required field value is missing', () => {
    const toOneRelationshipField = Relationship.toOneRequired(() => formatterA)
    const [, errors] = decodeToOneRelationship(
      toOneRelationshipField,
      'toOneA',
      {
        type: 'foo',
        id: 'foo-id',
      },
      [],
      {},
      {},
      {},
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toEqual({
      title: ValidationErrorMessage.MissingRequiredField,
      detail: `To-One relationship "toOneA" on resource of type "foo" is required`,
      source: {
        pointer: ['baz', 'toOneA'],
      },
    })
  })

  it('returns failure validation if the field value is invalid', () => {
    const toOneRelationshipField = Relationship.toOne(() => formatterA)
    const [, errors] = decodeToOneRelationship(
      toOneRelationshipField,
      'toOneA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toOneA: {
            data: 12 as any, // invalid
          },
        },
      },
      [],
      {},
      {},
      {},
      ['baz'],
    )

    expect(errors.length).toBe(3)
    expect(errors[0]).toEqual({
      title: ValidationErrorMessage.InvalidResourceIdentifier,
      detail: `Value must be an object`,
      source: {
        pointer: ['baz', 'toOneA'],
      },
    })
  })

  it('returns failure validation if some included resource is decoded with errors', () => {
    const toOneRelationshipField = Relationship.toOne(() => formatterA)
    const [, errors] = decodeToOneRelationship(
      toOneRelationshipField,
      'toOneA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toOneA: {
            data: {
              type: 'a',
              id: 'a-id',
            },
          },
        },
      },
      [
        {
          type: 'a',
          id: 'a-id',
          attributes: {
            requiredString: null, // invalid, must be a string
          },
        },
      ],
      {},
      {},
      {
        toOneA: null,
      },
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toEqual({
      title: ValidationErrorMessage.MissingRequiredField,
      detail: 'Attribute "requiredString" on resource of type "a" is required.',
      source: {
        pointer: ['baz', 'toOneA', 'requiredString'],
      },
    })
  })

  it('returns failure validation if some resource is not found in the included resources', () => {
    const toOneRelationshipField = Relationship.toOne(() => formatterA)
    const [, errors] = decodeToOneRelationship(
      toOneRelationshipField,
      'toOneA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toOneA: {
            data: {
              type: 'a',
              id: 'a-id',
            },
          },
        },
      },
      [], // invalid, missing included resource
      {},
      {},
      {
        toOneA: null,
      },
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toEqual({
      title: ValidationErrorMessage.IncludedResourceNotFound,
      detail: 'Resource object of type "a" with id "a-id" is not included.',
      source: {
        pointer: ['baz', 'toOneA'],
      },
    })
  })
})
