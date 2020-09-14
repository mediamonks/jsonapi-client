import jsonapi, { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/string'
import { book } from './book'
import { photo } from './photo'

type SeriesResource = ResourceFormatter<
  'series',
  {
    title: Attribute.Required<string>
    photos: Relationship.ToMany<typeof photo>
    books: Relationship.ToMany<typeof book>
  }
>

export const series: SeriesResource = jsonapi.formatter('series', {
  title: Attribute.required(string),
  photos: Relationship.toMany(() => photo),
  books: Relationship.toMany(() => book),
})
