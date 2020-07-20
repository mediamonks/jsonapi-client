import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { dateString, dateStringFormatter } from './attribute-types/date'
import { string } from './attribute-types/string'
import { uint } from './attribute-types/uint'

import author from './author'
import chapter from './chapter'
import photo from './photo'
import series from './series'
import store from './store'

type BookType = 'books'

type BookFields = {
  title: Attribute.Required<string>
  date_published: Attribute.Required<string, Date>
  isbn: Attribute.Required<number>
  author: Relationship.ToOne<typeof author>
  chapters: Relationship.ToManyReadOnly<typeof chapter>
  photos: Relationship.ToMany<typeof photo>
  series: Relationship.ToOne<typeof series>
  stores: Relationship.ToMany<typeof store>
}

type BookResource = ResourceFormatter<BookType, BookFields>

const book: BookResource = JSONAPI.resource('books', {
  title: Attribute.required(string),
  date_published: Attribute.required(dateString, dateStringFormatter),
  isbn: Attribute.required(uint),
  author: Relationship.toOne(() => [author]),
  chapters: Relationship.toManyReadOnly(() => [chapter]),
  photos: Relationship.toMany(() => [photo]),
  series: Relationship.toOne(() => [series]),
  stores: Relationship.toMany(() => [store]),
})

export default book
