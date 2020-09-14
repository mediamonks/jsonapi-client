import { formatterA } from '../../test/formatters'
import { decodeResourceObject } from './decodeResourceObject'

describe('decodeRelationship', () => {
  it('returns a validation array', () => {
    const validation = decodeResourceObject([formatterA], {} as any, [], {}, {}, [])
    const [value, errors] = validation

    expect(validation).toBeInstanceOf(Array)
    expect(value).toBe(null)
    expect(errors).toBeInstanceOf(Array)
  })

  it.todo('returns a success validation when a resource object matches any of its formatters')

  it.todo('returns a failure validation when a resource object is not valid')

  it.todo(
    'returns a failure validation when a resource object does not match any of its formatters',
  )

  it.todo('throws an error when a field is included that is not allowed')
})
