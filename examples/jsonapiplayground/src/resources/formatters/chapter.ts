import JSONAPI, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'
import { uint } from '../attributes/uint'
import { book } from './book'
import { photo } from './photo'

type ChapterType = 'chapters'

type ChapterFields = {
  title: Attribute.Required<string>
  ordering: Attribute.Required<number>
  photos: Relationship.ToMany<typeof photo>
  book: Relationship.ToOne<typeof book>
}

type ChapterResource = ResourceFormatter<ChapterType, ChapterFields>

export const chapter: ChapterResource = JSONAPI.resource('chapters', {
  title: Attribute.required(string),
  ordering: Attribute.required(uint),
  photos: Relationship.toMany(() => [photo]),
  book: Relationship.toOne(() => [book]),
})
