import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'
import { book } from './book'
import { photo } from './photo'

type SeriesType = 'series'

type SeriesFields = {
  title: Attribute.Required<string>
  photos: Relationship.ToMany<typeof photo>
  books: Relationship.ToMany<typeof book>
}

type SeriesResource = ResourceFormatter<SeriesType, SeriesFields>

export const series: SeriesResource = JSONAPI.resource('series', {
  title: Attribute.required(string),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})
