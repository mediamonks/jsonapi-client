import { Attribute, Relationship, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { dateString, dateStringFormatter } from '../attributes/date'
import { string } from '../attributes/string'
import { book, BookFormatter } from './book'
import { photo, PhotoFormatter } from './photo'

export type AuthorFormatter = ResourceFormatter<
  'authors',
  {
    name: Attribute.Required<string>
    birthplace: Attribute.Required<string>
    date_of_birth: Attribute.Required<string, Date>
    date_of_death: Attribute.Optional<string, Date>
    photos: Relationship.ToMany<PhotoFormatter>
    books: Relationship.ToMany<BookFormatter>
  }
>

export const author: AuthorFormatter = new ResourceFormatter('authors', {
  name: Attribute.required(string),
  birthplace: Attribute.required(string),
  date_of_birth: Attribute.required(dateString, dateStringFormatter),
  date_of_death: Attribute.optional(dateString, dateStringFormatter),
  photos: Relationship.toMany(() => photo),
  books: Relationship.toMany(() => book),
})
