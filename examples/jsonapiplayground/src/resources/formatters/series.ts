import { Attribute, Relationship, ResourceFormatter } from '@mediamonks/jsonapi-client'

import { string } from '../attributes/string'
import { book, BookFormatter } from './book'
import { photo, PhotoFormatter } from './photo'

export type SeriesFormatter = ResourceFormatter<
  'series',
  {
    title: Attribute.Required<string>
    photos: Relationship.ToMany<PhotoFormatter>
    books: Relationship.ToMany<BookFormatter>
  }
>

export const series: SeriesFormatter = new ResourceFormatter('series', {
  title: Attribute.required(string),
  photos: Relationship.toMany(() => photo),
  books: Relationship.toMany(() => book),
})
