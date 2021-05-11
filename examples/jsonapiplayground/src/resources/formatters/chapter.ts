import { Attribute, Relationship, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { string } from '../attributes/string'
import { uint } from '../attributes/uint'
import { book, BookFormatter } from './book'
import { photo, PhotoFormatter } from './photo'

export type ChapterFormatter = ResourceFormatter<
  'chapters',
  {
    title: Attribute.Required<string>
    ordering: Attribute.Required<number>
    photos: Relationship.ToMany<PhotoFormatter>
    book: Relationship.ToOne<BookFormatter>
  }
>

export const chapter: ChapterFormatter = new ResourceFormatter('chapters', {
  title: Attribute.required(string),
  ordering: Attribute.required(uint),
  photos: Relationship.toMany(() => photo),
  book: Relationship.toOne(() => book),
})
