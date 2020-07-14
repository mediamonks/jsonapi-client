import { isString, isUint } from 'isntnt'
import { resource, Attribute, Relationship, ResourceFormatter } from '../../../../src'

import Photo from './Photo'
import Book from './Book'

type SeriesType = 'series'

type SeriesFields = {
  title: Attribute.Required<string>
  photos: Relationship.ToMany<typeof Photo>
  books: Relationship.ToMany<typeof Book>
}

type SeriesResource = ResourceFormatter<SeriesType, SeriesFields>

const Series: SeriesResource = resource('series', 'series', {
  title: Attribute.required(isString),
  photos: Relationship.toMany(() => [Photo]),
  books: Relationship.toMany(() => [Book]),
})

export default Series
