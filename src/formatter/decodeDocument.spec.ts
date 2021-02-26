import { decodeDocument } from './decodeDocument'
import { formatterA } from '../../test/formatters'

type InvalidJSONAPIDocument = any

describe('decodeDocument', () => {
  it('returns an empty resource document if data is an empty array', () => {
    expect(
      decodeDocument([formatterA], {
        data: [],
      }),
    ).toEqual([])
  })

  it('returns an resource array if document is of-many', () => {
    expect(
      decodeDocument([formatterA], {
        data: [
          {
            type: 'a',
            id: '<some-id>',
            attributes: {
              requiredString: 'foo',
            },
          },
        ],
      }),
    ).toEqual([
      {
        type: 'a',
        id: '<some-id>',
        requiredString: 'foo',
        optionalString: null,
        toOneB: null,
        toManyA: [],
      },
    ])
  })

  it('returns an resource if document is of-one', () => {
    expect(
      decodeDocument([formatterA], {
        data: {
          type: 'a',
          id: '<some-id>',
          attributes: {
            requiredString: 'foo',
          },
        },
      }),
    ).toEqual({
      type: 'a',
      id: '<some-id>',
      requiredString: 'foo',
      optionalString: null,
      toOneB: null,
      toManyA: [],
    })
  })

  it.todo('stores document meta/links if document has meta/links')

  it.todo('stores resource meta/links if document resource has meta/links')

  it('returns an of-many resource document if data is an array of valid resource objects', () => {
    expect(
      decodeDocument([formatterA], {
        data: [
          {
            type: 'a',
            id: '<some-id>',
            attributes: {
              requiredString: 'foo',
            },
          },
        ],
      }),
    ).toEqual([
      {
        type: 'a',
        id: '<some-id>',
        requiredString: 'foo',
        optionalString: null,
        toOneB: null,
        toManyA: [],
      },
    ])
  })

  it('throws when a document with an invalid of-one resource value is passed', () => {
    expect(() => {
      decodeDocument([formatterA], {
        data: {
          type: 'a',
          id: '<some-id>',
          attributes: {
            requiredString: null as any,
          },
        },
      })
    }).toThrow()
  })

  it('throws when a document with an invalid of-many resource value is passed', () => {
    expect(() => {
      decodeDocument([formatterA], {
        data: [
          {
            type: 'x' as any,
            id: '<some-id>',
            attributes: {
              requiredString: null as any,
            },
          },
        ],
      })
    }).toThrow()
  })

  it('throws when an invalid document value is passed', () => {
    expect(() => {
      decodeDocument([formatterA], null as InvalidJSONAPIDocument)
    }).toThrow()

    expect(() => {
      decodeDocument([formatterA], [] as InvalidJSONAPIDocument)
    }).toThrow()

    expect(() => {
      decodeDocument([formatterA], {
        data: {
          type: '_invalid+type_' as any,
          id: '<some-id>',
        },
      })
    }).toThrow()

    expect(() => {
      decodeDocument([formatterA], {
        data: null,
      } as InvalidJSONAPIDocument)
    }).toThrow()
  })

  it('throws when an document with data AND errors is passed', () => {
    expect(() => {
      decodeDocument([formatterA], {
        data: {
          type: 'a',
          id: '<some-id>',
        },
        errors: [],
      })
    }).toThrow()
  })

  it('throws when an document with errors is passed', () => {
    expect(() => {
      decodeDocument([formatterA], {
        errors: [
          {
            title: 'Whoops',
          },
        ],
      })
    }).toThrow()
  })
})
