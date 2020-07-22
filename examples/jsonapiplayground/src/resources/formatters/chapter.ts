import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'
import { uint } from '../attributes/uint'
import { book } from './book'
import { photo } from './photo'

type ChapterResource = ResourceFormatter<
  'chapters',
  {
    title: Attribute.Required<string>
    ordering: Attribute.Required<number>
    photos: Relationship.ToMany<typeof photo>
    book: Relationship.ToOne<typeof book>
  }
>

export const chapter: ChapterResource = JSONAPI.resource('chapters', {
  title: Attribute.required(string),
  ordering: Attribute.required(uint),
  photos: Relationship.toMany(() => [photo]),
  book: Relationship.toOne(() => [book]),
})
