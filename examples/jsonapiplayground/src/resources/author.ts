import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { dateString, dateStringFormatter } from './attribute-types/date'
import { string } from './attribute-types/string'

import book from './book'
import photo from './photo'

type AuthorType = 'authors'

type AuthorFields = {
  name: Attribute.Required<string>
  birthplace: Attribute.Required<string>
  date_of_birth: Attribute.Required<string, Date>
  date_of_death: Attribute.Optional<string, Date>
  photos: Relationship.ToMany<typeof photo>
  books: Relationship.ToMany<typeof book>
}

type AuthorResource = ResourceFormatter<AuthorType, AuthorFields>

const author: AuthorResource = JSONAPI.resource('authors', {
  name: Attribute.required(string),
  birthplace: Attribute.required(string),
  date_of_birth: Attribute.required(dateString, dateStringFormatter),
  date_of_death: Attribute.optional(dateString, dateStringFormatter),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})

export default author
