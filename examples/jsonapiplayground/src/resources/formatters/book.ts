import { Attribute, Relationship, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { dateString, dateStringFormatter } from '../attributes/date'
import { string } from '../attributes/string'
import { uint } from '../attributes/uint'
import { author, AuthorFormatter } from './author'
import { chapter, ChapterFormatter } from './chapter'
import { photo, PhotoFormatter } from './photo'
import { series, SeriesFormatter } from './series'
import { store, StoreFormatter } from './store'

export type BookFormatter = ResourceFormatter<
  'books',
  {
    title: Attribute.Required<string>
    date_published: Attribute.Required<string, Date>
    isbn: Attribute.Required<number>
    author: Relationship.ToOne<AuthorFormatter>
    chapters: Relationship.ToManyReadOnly<ChapterFormatter>
    photos: Relationship.ToMany<PhotoFormatter>
    series: Relationship.ToOne<SeriesFormatter>
    stores: Relationship.ToMany<StoreFormatter>
  }
>

export const book: BookFormatter = new ResourceFormatter('books', {
  title: Attribute.required(string),
  date_published: Attribute.required(dateString, dateStringFormatter),
  isbn: Attribute.required(uint),
  author: Relationship.toOne(() => author),
  chapters: Relationship.toManyReadOnly(() => chapter),
  photos: Relationship.toMany(() => photo),
  series: Relationship.toOne(() => series),
  stores: Relationship.toMany(() => store),
})
