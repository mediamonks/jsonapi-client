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

  it('returns a success validation when a resource object matches its formatter', () => {
    const [value, errors] = decodeResourceObject(
      [formatterA],
      {
        type: 'a',
        id: '<some-id>',
        attributes: {
          requiredString: 'abc',
        },
      },
      [],
      {},
      {},
      [],
    )
    expect(value).toEqual({
      type: 'a',
      id: '<some-id>',
      requiredString: 'abc',
      optionalString: null,
      toOneB: null,
      toManyA: [],
    })
    expect(errors).toEqual([])
  })

  it('returns a failure validation when a resource object does not match its formatter', () => {
    const [value, errors] = decodeResourceObject(
      [formatterA],
      {
        type: 'a',
        id: '<some-id>',
        attributes: {
          requiredString: null,
          optionalString: 12,
        },
      },
      [],
      {},
      {},
      [],
    )
    expect(value).toBe(null)
    expect(errors.length).toBe(2)
  })

  it('returns a failure validation when a resource object is not valid', () => {
    const [value, errors] = decodeResourceObject([formatterA], null as any, [], {}, {}, [])
    expect(value).toBe(null)
    expect(errors.length > 0).toBe(true)
  })

  it('throws an error when a field is included that does not exist', () => {
    expect(() =>
      decodeResourceObject(
        [formatterA],
        {
          type: 'a',
          id: '<some-id>',
          attributes: {
            requiredString: 'abc',
          },
        },
        [],
        {
          a: ['non_existing_field'],
        },
        {},
        [],
      ),
    ).toThrow()
  })

  it.todo('throws an error when a field is included that is not allowed')
})
