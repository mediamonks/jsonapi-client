import { isString, isUint } from 'isntnt'
import { resource, Attribute, Relationship, ResourceFormatter } from '../../../../src'

import Book from './Book'
import Country from './Country'
import Photo from './Photo'

type StoreType = 'stores'

type StoreFields = {
  name: Attribute.Required<string>
  address: Attribute.RequiredStatic<string>
  created_by: Attribute.RequiredReadonly<number>
  photos: Relationship.ToMany<typeof Photo>
  books: Relationship.ToMany<typeof Book>
  countries: Relationship.ToOne<typeof Country>
}

type StoreResource = ResourceFormatter<StoreType, StoreFields>

const Store: StoreResource = resource('stores', 'stores', {
  name: Attribute.required(isString),
  address: Attribute.requiredStatic(isString),
  created_by: Attribute.requiredReadonly(isUint),
  photos: Relationship.toMany(() => [Photo]),
  books: Relationship.toMany(() => [Book]),
  countries: Relationship.toOne(() => [Country]),
})

export default Store
