import { decodeResourceIdentifier } from './decodeResourceIdentifier'
import formatter from '../formatter'
import { ResourceIdentifier } from '../resource/identifier'

describe('getResourceIdentifierResult', () => {
  it('returns a success validation if its value is a valid resource identifier', () => {
    const foo = formatter('Foo', {})
    const identifier = {
      type: 'Foo',
      id: 'some-foo',
    }
    const [resourceIdentifier, validationErrors] = decodeResourceIdentifier([foo], identifier, [])
    expect(validationErrors.length).toBe(0)
    expect(resourceIdentifier).toBeInstanceOf(ResourceIdentifier)
    expect(resourceIdentifier).toEqual(identifier)
  })

  it.todo('returns a failure validation if the value is not a valid resource identifier')

  it.todo('returns a failure validation if the resource type is not found in any formatter')
})
