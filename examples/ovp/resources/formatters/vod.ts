import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { asset } from './asset'
import { ScheduleSessionResource } from './scheduleSession'
import { SpriteSheetResource } from './spriteSheet'
import { StreamResource } from './stream'
import { tag } from './tag'

export type VODType = 'VOD'

export type VODFields = {
  videoType: Attribute.Required<string>
  title: Attribute.Required<string>
  start: Attribute.Optional<string, Date>
  end: Attribute.Optional<string, Date>
  /**
   * duration in seconds
   */
  duration: Attribute.Optional<number>
  publishedAt: Attribute.Optional<string, Date>
  sviJobId: Attribute.Optional<string>
  sviJobStatus: Attribute.Optional<string>
  updated: Attribute.Optional<string, Date>
  scheduleSession: Relationship.ToOne<ScheduleSessionResource>
  spriteSheet: Relationship.ToOne<SpriteSheetResource>
  thumbnail: Relationship.ToOne<typeof asset>
  stream: Relationship.ToOne<StreamResource>
  tags: Relationship.ToMany<typeof tag>
}

export type VODResource = ResourceFormatter<VODType, VODFields>
