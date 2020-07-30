import { getResourceIdentifierResult } from './getResourceIdentifierResult'
import { formatter } from '.'
import { ResourceIdentifier } from '../identifier'

describe('getResourceIdentifierResult', () => {
  it('is a function', () => {
    expect(getResourceIdentifierResult).toBeInstanceOf(Function)
  })

  it('returns a Success<ResourceIdentifier> if its value is a valid resource identifier', () => {
    const foo = formatter('Foo', {})
    const identifier = {
      type: 'Foo',
      id: 'some-foo',
    }
    const [resourceIdentifier, validationErrors] = getResourceIdentifierResult(
      [foo],
      identifier,
      [],
    )
    expect(validationErrors.length).toBe(0)
    expect(resourceIdentifier).toBeInstanceOf(ResourceIdentifier)
    expect(resourceIdentifier).toEqual(identifier)
  })

  it.todo(
    'returns a Failure<ResourceValidationErrorObject> if the value is not a valid resource identifier',
  )

  it.todo(
    'returns a Failure<ResourceValidationErrorObject> if the value type is not found in any formatter',
  )
})
