import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { asset, AssetResource } from './asset'
import { tag, TagResource } from './tag'
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
    image: Relationship.ToOne<AssetResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const photo: PhotoResource = new ResourceFormatter('Photo', {
  description: Attribute.optional(string),
  copyright: Attribute.optional(string),
  created: Attribute.optional(isoDateString, isoDateStringFormatter),
  updated: Attribute.optional(isoDateString, isoDateStringFormatter),
  publishedAt: Attribute.optional(isoDateString, isoDateStringFormatter),
  width: Attribute.optional(uint),
  height: Attribute.optional(uint),
  image: Relationship.toOne(() => asset),
  tags: Relationship.toMany(() => tag),
})
