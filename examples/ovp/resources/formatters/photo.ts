import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { asset } from './asset'
import { tag } from './tag'

export type PhotoType = 'Photo'

export type PhotoFields = {
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

export type PhotoResource = ResourceFormatter<PhotoType, PhotoFields>
