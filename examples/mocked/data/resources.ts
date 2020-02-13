import { and, shape, literal, isString, isArray, Predicate, isObject } from 'isntnt'

const reflect = <T>(value: T): T => value

const isAnyResourceIdentifier = shape({
  type: isString,
  id: isString,
})

const isAnyResource = and(
  isAnyResourceIdentifier,
  shape({
    attributes: isObject,
    relationships: isObject,
  }),
) as Predicate<ResourceData<any>>

const createIsResourceIdentifier = <T extends string>(type: T) =>
  shape({
    type: literal(type),
    id: isString,
  })

type AttributeValue =
  | string
  | number
  | boolean
  | null
  | Array<AttributeValue>
  | {
      [key: string]: AttributeValue
    }

type RelationshipValue = Array<ResourceIdentifier<any>> | ResourceIdentifier<any> | null

type ResourceIdentifier<T extends string> = {
  type: T
  id: string
}

type ResourceData<T extends string> = {
  type: T
  id: string
  attributes: Record<string, AttributeValue>
  relationships: Record<string, { data: RelationshipValue }>
}

type ResourceResponse<T extends string> = {
  data: ResourceData<T>
  included: Array<ResourceData<any>>
}

const data = (value: any) => ({ data: value })

const getRandomIndex = (array: Array<any>): number => Math.floor(Math.random() * array.length)

const getRandomElement = <T>(array: Array<T>): T | undefined => array[getRandomIndex(array)]

const resources: Record<string, any> = {}

const defineResource = <T extends string>(
  type: T,
  createAttributes: (value: any, id: string, type: T) => Record<string, AttributeValue>,
  createRelationships: (
    value: any,
    id: string,
    type: T,
  ) => Record<string, { data: RelationshipValue }>,
) => {
  const store: Array<ResourceData<T>> = []
  const getId = (): string => String(store.length + 1)
  const isIdentifier = createIsResourceIdentifier(type)
  return (resources[type] = {
    store,
    create(value: any, postProcess: (resource: ResourceData<T>) => any = reflect): void {
      const id = getId()
      const resource = {
        type,
        id,
        attributes: createAttributes(value, id, type),
        relationships: createRelationships(value, id, type),
      }
      store.push(resource)
      postProcess(resource)
    },
    patch(id: string, update: (resource: ResourceData<T>) => void): void {
      const resource = this.getResource(id)
      if (isAnyResource(resource)) {
        update(resource)
      }
    },
    find(predicate: (value: ResourceData<T>) => boolean): string | null {
      return (store.find(predicate) || { id: null }).id
    },
    getResource(id: string): ResourceData<T> | null {
      return store.find((resource) => resource.id === id) || null
    },
    getResponseCollection(a?: number, b?: number): any {
      const included = Object.values(resources).flatMap((resource) => resource.store)
      const data = store.map((resource) => this.getResource(resource.id)).slice(a, b)

      // console.log('raw data', included)
      return {
        data,
        included,
      }
    },
    getResponse(id: string): ResourceResponse<T> | null {
      const data = this.getResource(id)
      if (isAnyResource(data)) {
        const included = Object.values(resources).flatMap((resource) => resource.store)
        return {
          data,
          included,
        }
      }
      return data
    },
    isIdentifier,
    getIdentifier(id: string): ResourceIdentifier<T> | null {
      return store.some((resource) => {
        return resource.id === id
      })
        ? { type, id }
        : null
    },
    getLength() {
      return store.length
    },
    getRandomId() {
      return String(1 + getRandomIndex(store))
    },
  })
}

const getRandomAge = () => Math.floor(Math.random() * 50 + 10)

const people = defineResource(
  'person',
  (name: string) => ({
    name,
    age: getRandomAge(),
  }),
  () => {
    const country = countries.getResource(countries.getRandomId())!
    const cityIdentifier = getRandomElement(country.relationships.cities.data as Array<any>)
    return {
      country: data(countries.getIdentifier(country.id)),
      city: data(cityIdentifier),
    }
  },
)

const countries = defineResource(
  'country',
  (name: string) => ({ name }),
  () => ({
    citizens: data([]),
    cities: data([]),
  }),
)

const cities = defineResource('city', reflect, () => ({
  country: data(null),
}))

const locationData = [
  {
    country: 'the Netherlands',
    cities: [
      { name: 'Amsterdam', latLong: [0, 20] },
      { name: 'Utrecht', latLong: [0, 30] },
    ],
  },
]

locationData.forEach((location) =>
  countries.create(location.country, (country) => {
    location.cities.forEach((attributes) => {
      cities.create(attributes, (city) => {
        city.relationships.country.data = countries.getIdentifier(country.id)
        const countryCitiesData = country.relationships.cities.data
        if (isArray(countryCitiesData)) {
          countryCitiesData.push(cities.getIdentifier(city.id)!)
        }
      })
    })
  }),
)

const peopleNames = ['Harry', 'Jane', 'Jonas', 'Mary']

peopleNames.forEach((name) =>
  people.create(name, (person) => {
    const countryData = person.relationships.country.data
    if (countries.isIdentifier(countryData)) {
      countries.patch(countryData.id, (country) => {
        const citizensData = country.relationships.citizens.data
        if (isArray(citizensData)) {
          citizensData.push(people.getIdentifier(person.id)!)
        }
      })
    }
  }),
)

export default {
  cities,
  countries,
  people,
}
