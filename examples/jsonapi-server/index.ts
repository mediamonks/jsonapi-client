import 'babel-polyfill'
import { isString, isNumber, tuple, Static, isSome } from 'isntnt'

import mocks from './data/resources'
import Api, {
  ascend,
  descend,
  resource,
  requiredAttribute,
  toManyRelationship,
  toOneRelationship,
  ToManyRelationship,
  ToOneRelationship,
  RequiredAttribute,
} from '../../src/'

// fetch mock
;(window as any).fetch = (href: string, options: any = {}): Promise<any> => {
  console.log('fetched', href, options)
  const url = new URL(href)
  const [, path, id] = url.pathname.split(/\//g).filter(Boolean)
  if (isSome((mocks as any)[path])) {
    const response = isSome(id)
      ? (mocks as any)[path].getResponse(id)
      : (mocks as any)[path].getResponseCollection()
    if (isSome(response)) {
      return Promise.resolve({
        async json() {
          return response
        },
      })
    }
    return Promise.reject(404)
  }
  return Promise.reject(500)
}

class Person extends resource('person')<Person> {
  @requiredAttribute(isString) name!: RequiredAttribute<string>
  @requiredAttribute(isNumber) age!: RequiredAttribute<number>
  @toOneRelationship('country') country!: ToOneRelationship<Country>
  @toOneRelationship('city') city!: ToOneRelationship<City>
}

const isLatLong = tuple(isNumber, isNumber)

class City extends resource('city')<City> {
  @requiredAttribute(isString) name!: RequiredAttribute<string>
  @requiredAttribute(isLatLong) latLong!: RequiredAttribute<Static<typeof isLatLong>>
  @toOneRelationship('country') country!: Country | null
}

class Country extends resource('country')<Country> {
  @requiredAttribute(isString) name!: RequiredAttribute<string>
  @toManyRelationship('person') citizens!: ToManyRelationship<Person>
  @toManyRelationship('city') cities!: ToManyRelationship<City>
}

const url = new URL('https://example.com/api/')

const api = new Api(url, {
  version: '1.0',
  defaultIncludeFields: 'primary',
  createPageQuery(page: number) {
    return {
      number: page,
    }
  },
  afterRequest() {},
  parseRequestError() {
    return {
      test: 'aha',
    }
  },
})

api.register(City)

const people = api.endpoint('people', Person)
const countries = api.endpoint('countries', Country)

people.create({
  id: 'test',
  type: 'person',
  name: 'hans',
  age: 12,
  country: null,
  city: null,
})

countries
  .get('1', {
    fields: {
      city: ['name'],
    },
    include: {
      citizens: {
        city: {
          country: null,
        },
      },
    },
  })
  .then(console.log)

people
  .fetch(
    {
      page: 12,
      sort: [ascend('name'), descend('age')],
    },
    {
      fields: {
        country: ['name'],
        city: ['name'],
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
    console.log('people', q)
  })
  .catch(console.warn)
