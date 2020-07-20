import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { dateFormatter, isDateString } from './attribute-types/date'
import book from './book'
import photo from './Photo'

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
  name: Attribute.required(isString),
  birthplace: Attribute.required(isString),
  date_of_birth: Attribute.required(isDateString, dateFormatter),
  date_of_death: Attribute.optional(isDateString, dateFormatter),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})

export default author
