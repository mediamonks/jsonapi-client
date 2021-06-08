import { formatterA } from '../../test/formatters'
import { ValidationErrorMessage } from '../data/enum'
import { Relationship } from '../resource/field/relationship'
import { decodeToManyRelationship } from './decodeToManyRelationship'

describe('decodeToManyRelationship', () => {
  it('returns success if every included resource is decoded without errors', () => {
    const toManyRelationshipField = Relationship.toMany(() => formatterA)
    const [value, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toManyA: {
            data: [
              {
                type: 'a',
                id: 'a-id',
              },
            ],
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
        toManyA: null,
      },
      [],
    )

    expect(value).toEqual([
      {
        type: 'a',
        id: 'a-id',
        requiredString: 'test',
        optionalString: null,
        toOneB: null,
        toManyA: [],
      },
    ])

    expect(errors.length).toBe(0)
  })

  it('returns success if the relationship is decoded without errors', () => {
    const toManyRelationshipField = Relationship.toMany(() => formatterA)
    const [value, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toManyA: {
            data: [
              {
                type: 'a',
                id: 'a-id',
              },
            ],
          },
        },
      },
      [],
      {},
      {},
      {},
      [],
    )

    expect(value).toEqual([
      {
        type: 'a',
        id: 'a-id',
      },
    ])

    expect(errors.length).toBe(0)
  })

  it('returns failure validation if a required field value is missing', () => {
    const toManyRelationshipField = Relationship.toManyRequired(() => formatterA)
    const [, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
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
    expect(errors[0]).toMatchObject({
      title: ValidationErrorMessage.MissingRequiredField,
      detail: `To-Many relationship "toManyA" on resource of type "foo" is required`,
      source: {
        pointer: ['baz', 'toManyA'],
      },
    })
  })

  it('returns failure validation if the field value is not an array', () => {
    const toManyRelationshipField = Relationship.toMany(() => formatterA)
    const [, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toManyA: {
            data: null,
          },
        },
      },
      [],
      {},
      {},
      {},
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toMatchObject({
      title: ValidationErrorMessage.InvalidToManyRelationshipData,
      detail: `To-Many relationship "toManyA" on resource of type "foo" must be an Array`,
      source: {
        pointer: ['baz', 'toManyA'],
      },
    })
  })

  it('returns failure validation if some included resource is decoded with errors', () => {
    const toManyRelationshipField = Relationship.toMany(() => formatterA)
    const [, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toManyA: {
            data: [
              {
                type: 'a',
                id: 'a-id',
              },
            ],
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
        toManyA: null,
      },
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toMatchObject({
      title: ValidationErrorMessage.MissingRequiredField,
      detail: 'Attribute "requiredString" on resource of type "a" is required.',
      source: {
        pointer: ['baz', 'toManyA', 'requiredString'],
      },
    })
  })

  it('returns failure validation if some resource is not found in the included resources', () => {
    const toManyRelationshipField = Relationship.toMany(() => formatterA)
    const [, errors] = decodeToManyRelationship(
      toManyRelationshipField,
      'toManyA',
      {
        type: 'foo',
        id: 'foo-id',
        relationships: {
          toManyA: {
            data: [
              {
                type: 'a',
                id: 'a-id',
              },
            ],
          },
        },
      },
      [], // invalid, missing included resource
      {},
      {},
      {
        toManyA: null,
      },
      ['baz'],
    )

    expect(errors.length).toBe(1)
    expect(errors[0]).toMatchObject({
      title: ValidationErrorMessage.IncludedResourceNotFound,
      detail: 'Resource object of type "a" with id "a-id" is not included.',
      source: {
        pointer: ['baz', 'toManyA'],
      },
    })
  })
})
