import { isString, isUint } from 'isntnt'
import { resource, Attribute, Relationship, ResourceConstructor } from '../../../../src'

import Photo from './Photo'
import Book from './Book'

type ChapterType = 'chapters'

type ChapterFields = {
  title: Attribute.Required<string>
  ordering: Attribute.Required<number>
  photos: Relationship.ToMany<typeof Photo>
  book: Relationship.ToOne<typeof Book>
}

type ChapterResource = ResourceConstructor<ChapterType, ChapterFields>

const Chapter: ChapterResource = resource('chapters', 'chapters', {
  title: Attribute.required(isString),
  ordering: Attribute.required(isUint),
  photos: Relationship.toMany(() => [Photo]),
  book: Relationship.toOne(() => [Book]),
})

export default Chapter
