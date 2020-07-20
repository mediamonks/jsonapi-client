import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { string } from './attribute-types/string'

import photo from './photo'
import book from './book'

type SeriesType = 'series'

type SeriesFields = {
  title: Attribute.Required<string>
  photos: Relationship.ToMany<typeof photo>
  books: Relationship.ToMany<typeof book>
}

type SeriesResource = ResourceFormatter<SeriesType, SeriesFields>

const series: SeriesResource = JSONAPI.resource('series', {
  title: Attribute.required(string),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})

export default series
