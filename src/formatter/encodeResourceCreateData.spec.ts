import { formatterA, formatterB } from '../../test/formatters'
import { ValidationErrorMessage } from '../data/enum'
import { ResourceValidationError } from '../error'
import { ResourceFormatter } from '../formatter'
import { Attribute } from '../resource/field/attribute'
import { Relationship } from '../resource/field/relationship'
import { string } from '../util/validators'
import { encodeResourceCreateData } from './encodeResourceCreateData'

describe('encodeResourceCreateData', () => {
  it('returns a json:api encoded object when every field is valid', () => {
    const result = encodeResourceCreateData([formatterA], {
      type: 'a',
      id: 'test',
      optionalString: 'foo',
      requiredString: 'bar',
      toOneB: {
        type: 'b',
        id: 'foo',
      },
      toManyA: [],
    })

    expect(result).toEqual({
      data: {
        type: 'a',
        id: 'test',
        attributes: {
          optionalString: 'foo',
          requiredString: 'bar',
        },
        relationships: {
          toOneB: {
            data: {
              type: 'b',
              id: 'foo',
            },
          },
          toManyA: {
            data: [],
          },
        },
      },
    })
  })

  it('supports polymorphic data', () => {
    const resultA = encodeResourceCreateData([formatterA, formatterB], {
      type: 'a',
      id: 'test',
      optionalString: 'foo',
      requiredString: 'bar',
      toManyA: [],
    })

    expect(resultA).toEqual({
      data: {
        type: 'a',
        id: 'test',
        attributes: {
          optionalString: 'foo',
          requiredString: 'bar',
        },
        relationships: {
          toManyA: {
            data: [],
          },
        },
      },
    })

    const resultB = encodeResourceCreateData([formatterA, formatterB], {
      type: 'b',
      id: 'test',
      requiredString: 'bar',
    })

    expect(resultB).toEqual({
      data: {
        type: 'b',
        id: 'test',
        attributes: {
          requiredString: 'bar',
        },
      },
    })
  })

  it('serializes attribute field values', () => {
    const formatter = new ResourceFormatter('foo', {
      serializableField: Attribute.required(string, {
        deserialize: Number,
        serialize: String,
      }),
    })

    const data = encodeResourceCreateData([formatter], {
      type: 'foo',
      id: 'test',
      serializableField: 12,
    })

    expect(data.data.attributes?.serializableField).toBe('12')
  })

  it('throws when attempting to create with invalid data', () => {
    try {
      encodeResourceCreateData([formatterA], null as any)
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(0)
    }
  })

  it('throws when attempting to create data with non-existing type', () => {
    try {
      encodeResourceCreateData([formatterA], {
        type: '<invalid-type>',
        id: 'test',
        requiredString: 'foo',
      } as any)
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceType,
        detail: `Resource type must equal "a"`,
        source: {
          pointer: ['type'],
        },
      })
    }
  })

  it('throws when attempting to create data with a non-existing field', () => {
    try {
      encodeResourceCreateData([formatterA], {
        type: 'a',
        id: 'test',
        requiredString: 'foo',
        nonExistingField: 'bar',
      } as any)
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.FieldNotFound,
        detail: `Field "nonExistingField" does not exist on resource of type "a"`,
        source: {
          pointer: ['nonExistingField'],
        },
      })
    }
  })

  it('throws when attempting to create data with a forbidden field', () => {
    const formatter = new ResourceFormatter('foo', {
      forbiddenField: Attribute.requiredReadonly(string),
    })
    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        forbiddenField: 'foo',
      } as any)
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceField,
        detail: `Field "forbiddenField" must be omitted on resource of type "foo"`,
        source: {
          pointer: ['forbiddenField'],
        },
      })
    }
  })

  it('throws when attempting to create data with a missing required field', () => {
    const formatter = new ResourceFormatter('foo', {
      requiredField: Attribute.required(string),
    })

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
      } as any)
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceField,
        detail: `Field "requiredField" is required on resource of type "foo"`,
        source: {
          pointer: ['requiredField'],
        },
      })
    }

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        requiredField: null as any,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceField,
        detail: `Field "requiredField" is required on resource of type "foo"`,
        source: {
          pointer: ['requiredField'],
        },
      })
    }
  })

  it('throws when attempting to create data with an invalid attribute field value', () => {
    const formatter = new ResourceFormatter('foo', {
      requiredString: Attribute.required(string),
    })

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        requiredString: 12 as any,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidAttributeValue,
        detail: `Value must be a string`,
        source: {
          pointer: ['requiredString'],
        },
      })
    }
  })

  it('throws when attempting to create data with an invalid to-one relationship field value', () => {
    const formatter = new ResourceFormatter('foo', {
      toOne: Relationship.toOne(() => formatterA),
    })

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        toOne: 12 as any,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(3)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceIdentifier,
        detail: `Value must be an object`,
        source: {
          pointer: ['toOne'],
        },
      })
    }

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        toOne: {
          type: 'bar' as 'a',
          id: 'baz',
        },
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceType,
        detail: `To-One relationship "toOne" must be a resource identifier of type "a"`,
        source: {
          pointer: ['toOne'],
        },
      })
    }
  })

  it('throws when attempting to create data with an invalid to-many relationship field value', () => {
    const formatter = new ResourceFormatter('foo', {
      toMany: Relationship.toMany(() => formatterA),
    })

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        toMany: 12 as any,
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidToManyRelationshipData,
        detail: `To-Many relationship "toMany" must be an Array on resource of type "a"`,
        source: {
          pointer: ['toMany'],
        },
      })
    }

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        toMany: [12 as any],
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(3)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceIdentifier,
        detail: `Value must be an object`,
        source: {
          pointer: ['toMany'],
        },
      })
    }

    try {
      encodeResourceCreateData([formatter], {
        type: 'foo',
        id: 'test',
        toMany: [
          {
            type: 'bar' as 'a',
            id: 'baz',
          },
        ],
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ResourceValidationError)
      expect(error.message).toBe(ValidationErrorMessage.InvalidResourceCreateData)
      expect(error.details.length).toBe(1)
      expect(error.details[0]).toEqual({
        title: ValidationErrorMessage.InvalidResourceType,
        detail: `Resource type must equal "a"`,
        source: {
          pointer: ['toMany'],
        },
      })
    }
  })
})
