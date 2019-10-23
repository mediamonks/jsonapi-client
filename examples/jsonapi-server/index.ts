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

// x
;(window as any).fetch = (href: string, options: any = {}): Promise<any> => {
  console.log('fetched', href, options)
  const url = new URL(href)
  const [path, id] = url.pathname
    .split('/')
    .filter(Boolean)
    .slice(-2)
  if (isSome((mocks as any)[path])) {
    const response = isSome(id)
      ? (mocks as any)[path].getResponse(id)
      : (mocks as any)[path].getResponseCollection()
    if (isSome(response)) {
      return Promise.resolve(response)
    }
    return Promise.reject(404)
  }
  return Promise.reject(500)
}

const url = new URL('https://example.com/api')

class Person extends resource('person')<Person> {
  @requiredAttribute(isString) name!: RequiredAttribute<string>
  @requiredAttribute(isNumber) age!: RequiredAttribute<number>
  @toOneRelationship('country') country!: ToOneRelationship<Country>
  @toOneRelationship('city') city!: ToOneRelationship<City>
}

const isLatLong = tuple(isNumber, isNumber)

class City extends resource('city')<City> {
  @requiredAttribute(isString) name!: RequiredAttribute<string>
  @requiredAttribute(isLatLong) latLong!: RequiredAttribute<
    Static<typeof isLatLong>
  >
  @toOneRelationship('country') country!: Country | null
}

class Country extends resource('country')<Country> {
  @toManyRelationship('person') citizens!: ToManyRelationship<Person>
  @toManyRelationship('city') cities!: ToManyRelationship<City>
}

const api = new Api(url, {
  version: '1.0',
  defaultIncludeFields: 'primary',
  parseRequestError(error: any) {
    return error
  },
})

api.register(Country, City)

const people = api.endpoint('people', Person)

people.create({
  id: 'test',
  type: 'person',
  name: 'hans',
  age: 12,
  country: null,
  city: null,
})

people
  .fetch({
    page: 12,
    sort: [ascend('name'), descend('age')],
    filter: 'name=12&whatever=40',
    fields: {
      person: ['name', 'city'],
      country: ['cities', 'citizens'],
    },
    include: {
      city: {
        country: {
          citizens: {
            city: null,
          },
        },
      },
      // country: {
      //   citizens: {
      //     country: null,
      //   },
      // },
    },
  })
  .then((q) => {
    console.log('aii', q[0]['city']!['country']!['citizens'])
    // q['city']!['country']
  })
  .catch(console.warn)
