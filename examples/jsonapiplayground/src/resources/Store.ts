import { isString, isUint } from 'isntnt'
import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import book from './book'
import country from './Country'
import photo from './Photo'

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
  name: Attribute.required(isString),
  address: Attribute.requiredStatic(isString),
  created_by: Attribute.requiredReadonly(isUint),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
  countries: Relationship.toOne(() => [country]),
})

export default store
