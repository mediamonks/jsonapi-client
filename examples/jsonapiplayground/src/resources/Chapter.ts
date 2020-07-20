import { isString, isUint } from 'isntnt'
import JSONAPI, { Attribute, Relationship, ResourceFormatter } from '../../../../src'

import photo from './Photo'
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
  title: Attribute.required(isString),
  ordering: Attribute.required(isUint),
  photos: Relationship.toMany(() => [photo]),
  book: Relationship.toOne(() => [book]),
})

export default chapter
