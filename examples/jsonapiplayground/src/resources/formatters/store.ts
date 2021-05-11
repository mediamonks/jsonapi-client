import { Attribute, Relationship, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { string } from '../attributes/string'
import { uint } from '../attributes/uint'
import { book } from './book'
import { country } from './country'
import { photo } from './photo'

export type StoreFormatter = ResourceFormatter<
  'stores',
  {
    name: Attribute.Required<string>
    address: Attribute.RequiredStatic<string>
    created_by: Attribute.RequiredReadonly<number>
    photos: Relationship.ToMany<typeof photo>
    books: Relationship.ToMany<typeof book>
    countries: Relationship.ToOne<typeof country>
  }
>

export const store: StoreFormatter = new ResourceFormatter('stores', {
  name: Attribute.required(string),
  address: Attribute.requiredStatic(string),
  created_by: Attribute.requiredReadonly(uint),
  photos: Relationship.toMany(() => photo),
  books: Relationship.toMany(() => book),
  countries: Relationship.toOne(() => country),
})
