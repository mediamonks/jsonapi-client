import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { number, string } from '../attributes/primitive'
import { asset } from './asset'
import { scheduleSession } from './scheduleSession'
import { spriteSheet } from './spriteSheet'
import { stream } from './stream'
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
  scheduleSession: Relationship.ToOne<typeof scheduleSession>
  stream: Relationship.ToOne<typeof stream>
  spriteSheet: Relationship.ToOne<typeof spriteSheet>
  thumbnail: Relationship.ToOne<typeof asset>
  tags: Relationship.ToMany<typeof tag>
}

export type VODResource = ResourceFormatter<VODType, VODFields>

export const vod: VODResource = jsonapi.resource('VOD', {
  videoType: Attribute.required(string),
  title: Attribute.required(string),
  start: Attribute.optional(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  duration: Attribute.optional(number),
  publishedAt: Attribute.optional(isoDateString, isoDateStringFormatter),
  sviJobId: Attribute.optional(string),
  sviJobStatus: Attribute.optional(string),
  updated: Attribute.optional(isoDateString, isoDateStringFormatter),
  scheduleSession: Relationship.toOne(() => [scheduleSession]),
  stream: Relationship.toOne(() => [stream]),
  spriteSheet: Relationship.toOne(() => [spriteSheet]),
  thumbnail: Relationship.toOne(() => [asset]),
  tags: Relationship.toMany(() => [tag]),
})
