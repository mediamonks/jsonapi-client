import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { number, string } from '../attributes/primitive'
import { vodVideoType, VODVideoType } from '../attributes/vodVideoType'
import { asset, AssetResource } from './asset'
import { scheduleSession, ScheduleSessionResource } from './scheduleSession'
import { spriteSheet, SpriteSheetResource } from './spriteSheet'
import { stream, StreamResource } from './stream'
import { tag, TagResource } from './tag'

export type VODResource = ResourceFormatter<
  'VOD',
  {
    videoType: Attribute.Required<VODVideoType>
    title: Attribute.Required<string>
    start: Attribute.Optional<string, Date>
    end: Attribute.Optional<string, Date>
    duration: Attribute.Optional<number>
    publishedAt: Attribute.Optional<string, Date>
    sviJobId: Attribute.Optional<string>
    sviJobStatus: Attribute.Optional<string>
    updated: Attribute.Optional<string, Date>
    scheduleSession: Relationship.ToOne<ScheduleSessionResource>
    stream: Relationship.ToOne<StreamResource>
    spriteSheet: Relationship.ToOne<SpriteSheetResource>
    thumbnail: Relationship.ToOne<AssetResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const vod: VODResource = new ResourceFormatter('VOD', {
  videoType: Attribute.required(vodVideoType),
  title: Attribute.required(string),
  start: Attribute.optional(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  duration: Attribute.optional(number),
  publishedAt: Attribute.optional(isoDateString, isoDateStringFormatter),
  sviJobId: Attribute.optional(string),
  sviJobStatus: Attribute.optional(string),
  updated: Attribute.optional(isoDateString, isoDateStringFormatter),
  scheduleSession: Relationship.toOne(() => scheduleSession),
  stream: Relationship.toOne(() => stream),
  spriteSheet: Relationship.toOne(() => spriteSheet),
  thumbnail: Relationship.toOne(() => asset),
  tags: Relationship.toMany(() => tag),
})
