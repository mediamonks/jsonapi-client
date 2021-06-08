import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import { ResourceFormatter } from '../formatter'
import { ResourceIdentifier } from '../resource/identifier'
import { ValidationErrorMessage } from '../data/enum'

describe('getResourceIdentifierResult', () => {
  it('returns a success validation if its value is a valid resource identifier', () => {
    const foo = new ResourceFormatter('foo', {})
    const identifier = {
      type: 'foo',
      id: 'some-foo',
    }
    const [resourceIdentifier, validationErrors] = decodeResourceIdentifier([foo], identifier, [])
    expect(validationErrors.length).toBe(0)
    expect(resourceIdentifier).toBeInstanceOf(ResourceIdentifier)
    expect(resourceIdentifier).toEqual(identifier)
  })

  it('returns a failure validation if the value is not a valid resource identifier', () => {
    const foo = new ResourceFormatter('foo', {})
    const [, validationErrors] = decodeResourceIdentifier([foo], null as any, ['baz'])

    expect(validationErrors.length).toBe(3)
    expect(validationErrors[0]).toMatchObject({
      title: ValidationErrorMessage.InvalidResourceIdentifier,
      detail: 'Value must be an object',
      source: {
        pointer: ['baz'],
      },
    })
  })

  it('returns a failure validation if the resource type is not found in any formatter', () => {
    const foo = new ResourceFormatter('foo', {})
    const identifier = {
      type: 'bar', // invalid
      id: 'some-id',
    }

    const [, validationErrors] = decodeResourceIdentifier([foo], identifier, ['baz'])

    expect(validationErrors.length).toBe(1)
    expect(validationErrors[0]).toMatchObject({
      title: ValidationErrorMessage.InvalidResourceType,
      detail: 'Resource type must match the type of its formatter (foo)',
      source: {
        pointer: ['baz', 'type'],
      },
    })
  })
})
