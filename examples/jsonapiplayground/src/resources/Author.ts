import { isString } from 'isntnt'
import { resource, Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { dateFormatter, isDateString } from './attribute-types'
import Book from './Book'
import Photo from './Photo'

type AuthorType = 'authors'

type AuthorFields = {
  name: Attribute.Required<string>
  birthplace: Attribute.Required<string>
  date_of_birth: Attribute.Required<string, Date>
  date_of_death: Attribute.Optional<string, Date>
  photos: Relationship.ToMany<typeof Photo>
  books: Relationship.ToMany<typeof Book>
}

type AuthorResource = ResourceFormatter<AuthorType, AuthorFields>

const Author: AuthorResource = resource('authors', 'authors', {
  name: Attribute.required(isString),
  birthplace: Attribute.required(isString),
  date_of_birth: Attribute.required(isDateString, dateFormatter),
  date_of_death: Attribute.optional(isDateString, dateFormatter),
  photos: Relationship.toMany(() => [Photo]),
  books: Relationship.toMany(() => [Book]),
})

export default Author
