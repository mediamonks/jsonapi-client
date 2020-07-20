import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import photo from './Photo'
import book from './book'

type SeriesType = 'series'

type SeriesFields = {
  title: Attribute.Required<string>
  photos: Relationship.ToMany<typeof photo>
  books: Relationship.ToMany<typeof book>
}

type SeriesResource = ResourceFormatter<SeriesType, SeriesFields>

const series: SeriesResource = JSONAPI.resource('series', {
  title: Attribute.required(isString),
  photos: Relationship.toMany(() => [photo]),
  books: Relationship.toMany(() => [book]),
})

export default series
