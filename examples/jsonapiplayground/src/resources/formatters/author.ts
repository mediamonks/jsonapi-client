import jsonapi, { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { dateString, dateStringFormatter } from '../attributes/date'
import { string } from '../attributes/string'
import { book } from './book'
import { photo } from './photo'

type AuthorResource = ResourceFormatter<
  'authors',
  {
    name: Attribute.Required<string>
    birthplace: Attribute.Required<string>
    date_of_birth: Attribute.Required<string, Date>
    date_of_death: Attribute.Optional<string, Date>
    photos: Relationship.ToMany<typeof photo>
    books: Relationship.ToMany<typeof book>
  }
>

export const author: AuthorResource = jsonapi.formatter('authors', {
  name: Attribute.required(string),
  birthplace: Attribute.required(string),
  date_of_birth: Attribute.required(dateString, dateStringFormatter),
  date_of_death: Attribute.optional(dateString, dateStringFormatter),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})
