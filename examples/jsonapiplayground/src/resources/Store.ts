import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { string } from './attribute-types/string'
import { uint } from './attribute-types/uint'

import book from './book'
import country from './country'
import photo from './photo'

type StoreType = 'stores'

type StoreFields = {
  name: Attribute.Required<string>
  address: Attribute.RequiredStatic<string>
  created_by: Attribute.RequiredReadonly<number>
  photos: Relationship.ToMany<typeof photo>
  books: Relationship.ToMany<typeof book>
  countries: Relationship.ToOne<typeof country>
}

type StoreResource = ResourceFormatter<StoreType, StoreFields>

const store: StoreResource = JSONAPI.resource('stores', {
  name: Attribute.required(string),
  address: Attribute.requiredStatic(string),
  created_by: Attribute.requiredReadonly(uint),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
  countries: Relationship.toOne(() => [country]),
})

export default store
