import 'babel-polyfill'
import { isString, isNumber, tuple, Static } from 'isntnt'

import JSONAPI, { Attribute, Relationship, FilteredResource } from '../../src'

export class Person extends JSONAPI.resource('person')<Person> {
  @Attribute.required(isString) name!: string
  @Attribute.optional(isNumber) age!: number
  @Relationship.toOne(() => Country) country!: Country | null
  @Relationship.toOne(() => City) city!: City | null
}

const isLatLong = tuple(isNumber, isNumber)

export class City extends JSONAPI.resource('city')<City> {
  @Attribute.required(isString) name!: string
  @Attribute.required(isLatLong) latLong!: Static<typeof isLatLong>
  @Relationship.toOne(() => Country) country!: Country | null
}

export class Country extends JSONAPI.resource('country')<Country> {
  @Attribute.required(isString) name!: string
  @Relationship.toMany(() => Person) citizens!: Person[]
  @Relationship.toMany(() => City) cities!: City[]
}

const url = new URL('https://example.com/api/')

const api = JSONAPI.client(url, {
  version: '1.0',
  createPageQuery(page: number) {
    return {
      number: page,
    }
  },
  fetchAdapter(url: string) {
    console.log(url)
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'Ok',
      json() {
        return Promise.resolve({
          data: {
            type: 'country',
            id: 'nl',
            attributes: {
              name: 'Netherlands',
            },
            relationships: {
              citizens: {
                data: [{ type: 'person', id: 'hans' }],
              },
              cities: {
                data: [{ type: 'city', id: 'hil' }],
              },
            },
          },
          included: [
            {
              type: 'person',
              id: 'hans',
              attributes: {
                name: 'Hans',
              },
            },
            {
              type: 'city',
              id: 'hil',
              attributes: {
                name: 'Hilversum',
              },
            },
          ],
        })
      },
    }) as any
  },
  parseRequestError() {
    return {
      test: 'aha',
    }
  },
})

const people = api.endpoint('people', Person)
const countries = api.endpoint('countries', Country)

1 &&
  people
    .getToOneRelationship('1', 'country', {
      fields: {
        person: ['name'],
        city: ['name'],
      },
      include: {
        cities: null,
        citizens: null,
      },
    })
    .then((response) => {
      console.log('to-one', response)
    })

type Fx = FilteredResource<
  Country,
  {
    fields: {
      person: ['name']
      city: ['name']
    }
    include: {
      cities: null
    }
  }
>

1 &&
  countries
    .getOne('1', {
      fields: {
        person: ['name'],
        city: ['name'],
      },
      include: {
        cities: null,
      },
    })
    .then((result) => {
      console.log('one', result)
    })

0 &&
  people
    .getMany(
      {
        page: 12,
        sort: ['name', '-age'],
      },
      {
        fields: {
          country: ['name', 'citizens'],
          city: ['name', 'country'],
        },
        include: {
          country: null,
          city: {
            country: {
              citizens: {
                city: null,
              },
            },
          },
        },
      },
    )
    .then((q) => {
      console.log('many', q)
    })
    .catch(console.warn)
