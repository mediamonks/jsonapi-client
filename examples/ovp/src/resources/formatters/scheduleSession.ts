import jsonapi, { Attribute, Relationship, ResourceFormatter, ResourceId } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string, boolean, number } from '../attributes/primitive'
import { promotionStatus, PromotionStatus } from '../attributes/promotionStatus'
import { scheduleSessionState, ScheduleSessionState } from '../attributes/scheduleSessionState'
import { asset } from './asset'
import { channel } from './channel'
import { commentary } from './commentary'
import { discipline } from './discipline'
import { organisation } from './organisation'
import { participant } from './participant'
import { scheduleItem } from './scheduleItem'
import { StreamResource, stream } from './stream'
import { tag } from './tag'
import { timelineMarker } from './timelineMarker'
import { usdfMessageId } from './usdfMessageId'
import { vod } from './vod'

export type ScheduleSessionResource = ResourceFormatter<
  'ScheduleSession',
  {
    externalId: Attribute.Required<string>
    code: Attribute.Required<string>
    title: Attribute.Required<string>
    awardIndicator: Attribute.Required<boolean>
    broadcastStart: Attribute.Required<string, Date>
    broadcastEnd: Attribute.Required<string, Date>
    coverageStart: Attribute.Required<string, Date>
    coverageEnd: Attribute.Required<string, Date>
    live: Attribute.Required<boolean>
    runUpTime: Attribute.Required<string>
    runDownTime: Attribute.Required<string>
    videoId: Attribute.Required<ResourceId>
    videoFeed: Attribute.Required<string>
    integrated: Attribute.Required<boolean>
    disciplineCode: Attribute.Optional<string>
    disciplineId: Attribute.Optional<ResourceId>
    end: Attribute.Optional<string, Date>
    competitionDate: Attribute.Optional<string, Date>
    scheduleItemCount: Attribute.Required<number>
    unilateral: Attribute.Required<boolean>
    // fieldsOfPlay: Attribute.Required<FieldOfPlay> Awaiting BE implementation
    promotionStatus: Attribute.Required<PromotionStatus>
    state: Attribute.Required<ScheduleSessionState>
    broadcastPublished: Attribute.Optional<string, Date>
    broadcastUnpublished: Attribute.Optional<string, Date>
    discipline: Relationship.ToOne<typeof discipline>
    organisation: Relationship.ToOne<typeof organisation>
    channel: Relationship.ToOne<typeof channel>
    stream: Relationship.ToOne<StreamResource>
    thumbnail: Relationship.ToOne<typeof asset>
    ferVod: Relationship.ToOne<typeof vod>
    highlightVod: Relationship.ToOne<typeof vod>
    timelineMarkers: Relationship.ToMany<typeof timelineMarker>
    commentaries: Relationship.ToMany<typeof commentary>
    usdfMessageIds: Relationship.ToMany<typeof usdfMessageId>
    vods: Relationship.ToMany<typeof vod>
    tags: Relationship.ToMany<typeof tag>
    scheduleItems: Relationship.ToMany<typeof scheduleItem>
    participants: Relationship.ToMany<typeof participant>
  }
>

export const scheduleSession: ScheduleSessionResource = jsonapi.formatter('ScheduleSession', {
  externalId: Attribute.required(string),
  code: Attribute.required(string),
  title: Attribute.required(string),
  awardIndicator: Attribute.required(boolean),
  broadcastStart: Attribute.required(isoDateString, isoDateStringFormatter),
  broadcastEnd: Attribute.required(isoDateString, isoDateStringFormatter),
  coverageStart: Attribute.required(isoDateString, isoDateStringFormatter),
  coverageEnd: Attribute.required(isoDateString, isoDateStringFormatter),
  live: Attribute.required(boolean),
  runUpTime: Attribute.required(string),
  runDownTime: Attribute.required(string),
  videoId: Attribute.required(string),
  videoFeed: Attribute.required(string),
  integrated: Attribute.required(boolean),
  disciplineCode: Attribute.optional(string),
  disciplineId: Attribute.optional(string),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  competitionDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  scheduleItemCount: Attribute.required(number),
  unilateral: Attribute.required(boolean),
  // fieldOfPlay: Attribute.required(fieldOfPlay),
  promotionStatus: Attribute.required(promotionStatus),
  state: Attribute.required(scheduleSessionState),
  broadcastPublished: Attribute.optional(isoDateString, isoDateStringFormatter),
  broadcastUnpublished: Attribute.optional(isoDateString, isoDateStringFormatter),
  discipline: Relationship.toOne(() => [discipline]),
  organisation: Relationship.toOne(() => [organisation]),
  channel: Relationship.toOne(() => [channel]),
  stream: Relationship.toOne(() => [stream]),
  thumbnail: Relationship.toOne(() => [asset]),
  ferVod: Relationship.toOne(() => [vod]),
  highlightVod: Relationship.toOne(() => [vod]),
  timelineMarkers: Relationship.toMany(() => [timelineMarker]),
  commentaries: Relationship.toMany(() => [commentary]),
  usdfMessageIds: Relationship.toMany(() => [usdfMessageId]),
  vods: Relationship.toMany(() => [vod]),
  tags: Relationship.toMany(() => [tag]),
  scheduleItems: Relationship.toMany(() => [scheduleItem]),
  participants: Relationship.toMany(() => [participant]),
})
