import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import { string } from './attribute-types/string'
import { uint } from './attribute-types/uint'

import photo from './photo'
import book from './book'

type ChapterType = 'chapters'

type ChapterFields = {
  title: Attribute.Required<string>
  ordering: Attribute.Required<number>
  photos: Relationship.ToMany<typeof photo>
  book: Relationship.ToOne<typeof book>
}

type ChapterResource = ResourceFormatter<ChapterType, ChapterFields>

const chapter: ChapterResource = JSONAPI.resource('chapters', {
  title: Attribute.required(string),
  ordering: Attribute.required(uint),
  photos: Relationship.toMany(() => [photo]),
  book: Relationship.toOne(() => [book]),
})

export default chapter
