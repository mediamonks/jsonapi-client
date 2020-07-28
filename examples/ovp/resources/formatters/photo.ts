import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { asset } from './asset'
import { tag } from './tag'
import { string, uint } from '../attributes/primitive'
import { isoDateString, isoDateStringFormatter } from '../attributes/date'

export type PhotoResource = ResourceFormatter<
  'Photo',
  {
    description: Attribute.Optional<string>
    copyright: Attribute.Optional<string>
    created: Attribute.Optional<string, Date>
    updated: Attribute.Optional<string, Date>
    publishedAt: Attribute.Optional<string, Date>
    width: Attribute.Optional<number>
    height: Attribute.Optional<number>
    image: Relationship.ToOne<typeof asset>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const photo: PhotoResource = jsonapi.formatter('Photo', {
  description: Attribute.optional(string),
  copyright: Attribute.optional(string),
  created: Attribute.optional(isoDateString, isoDateStringFormatter),
  updated: Attribute.optional(isoDateString, isoDateStringFormatter),
  publishedAt: Attribute.optional(isoDateString, isoDateStringFormatter),
  width: Attribute.optional(uint),
  height: Attribute.optional(uint),
  image: Relationship.toOne(() => [asset]),
  tags: Relationship.toMany(() => [tag]),
})
