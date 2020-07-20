import { isString, isUint } from 'isntnt'
import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { dateFormatter, isDateString } from './attribute-types/date'
import author from './author'
import chapter from './Chapter'
import photo from './Photo'
import series from './Series'
import store from './Store'

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
  title: Attribute.required(isString),
  date_published: Attribute.required(isDateString, dateFormatter),
  isbn: Attribute.required(isUint),
  author: Relationship.toOne(() => [author]),
  chapters: Relationship.toManyReadOnly(() => [chapter]),
  photos: Relationship.toMany(() => [photo]),
  series: Relationship.toOne(() => [series]),
  stores: Relationship.toMany(() => [store]),
})

export default book
