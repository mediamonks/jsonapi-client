import { isString, isUint } from 'isntnt'
import { resource, Attribute, Relationship, ResourceConstructor } from '../../../../src'

import { dateFormatter, isDateString } from './attribute-types'
import Author from './Author'
import Chapter from './Chapter'
import Photo from './Photo'
import Series from './Series'
import Store from './Store'

type BookType = 'books'

type BookFields = {
  title: Attribute.Required<string>
  date_published: Attribute.Required<string, Date>
  isbn: Attribute.Required<number>
  author: Relationship.ToOne<typeof Author>
  chapters: Relationship.ToManyReadOnly<typeof Chapter>
  photos: Relationship.ToMany<typeof Photo>
  series: Relationship.ToOne<typeof Series>
  stores: Relationship.ToMany<typeof Store>
}

type BookResource = ResourceConstructor<BookType, BookFields>

const Book: BookResource = resource('books', 'books', {
  title: Attribute.required(isString),
  date_published: Attribute.required(isDateString, dateFormatter),
  isbn: Attribute.required(isUint),
  author: Relationship.toOne(() => [Author]),
  chapters: Relationship.toManyReadOnly(() => [Chapter]),
  photos: Relationship.toMany(() => [Photo]),
  series: Relationship.toOne(() => [Series]),
  stores: Relationship.toMany(() => [Store]),
})

export default Book
