import {
  Attribute,
  Relationship,
  ResourceFormatter,
  ResourceId,
} from 'jsonapi-client'

import { asset } from './asset'
import { channel } from './channel'
import { commentary } from './commentary'
import { discipline } from './discipline'
import { OrganisationResource } from './organisation'
import { ParticipantResource } from './participant'
import { ScheduleItemResource } from './scheduleItem'
import { StreamResource } from './stream'
import { tag } from './tag'
import { TimelineMarkerResource } from './timelineMarker'
import { USDFMessageIdResource } from './usdfMessageId'
import { VODResource } from './vod'

export type ScheduleSessionType = 'ScheduleSession'

export type ScheduleSessionFields = {
  externalId: Attribute.Required<string>
  code: Attribute.Required<string>
  title: Attribute.Required<string>
  awardIndicator: Attribute.Required<boolean>
  broadcastStart: Attribute.Required<string, Date>
  broadcastEnd: Attribute.Required<string, Date>
  coverageStart: Attribute.Required<string, Date>
  coverageEnd: Attribute.Required<string, Date>
  live: Attribute.Required<boolean>
  runUpTime: Attribute.Required<string> // Date?
  runDownTime: Attribute.Required<string> // Date?
  videoId: Attribute.Required<ResourceId>
  videoFeed: Attribute.Required<string>
  integrated: Attribute.Required<boolean>
  disciplineCode: Attribute.Optional<string>
  disciplineId: Attribute.Optional<ResourceId>
  end: Attribute.Optional<string, Date>
  competitionDate: Attribute.Optional<string, Date>
  scheduleItemCount: Attribute.Required<number>
  unilateral: Attribute.Required<boolean>
  // fieldsOfPlay: Attribute.Required<{}> Awaiting BE implementation
  promotionStatus: Attribute.Required<string>
  state: Attribute.Required<string>
  broadcastPublished: Attribute.Optional<string, Date>
  broadcastUnpublished: Attribute.Optional<string, Date>
  discipline: Relationship.ToOne<typeof discipline>
  channel: Relationship.ToOne<typeof channel>
  stream: Relationship.ToOne<StreamResource>
  thumbnail: Relationship.ToOne<typeof asset>
  ferVod: Relationship.ToOne<VODResource>
  highlightVod: Relationship.ToOne<VODResource>
  timelineMarkers: Relationship.ToMany<TimelineMarkerResource>
  commentaries: Relationship.ToMany<typeof commentary>
  usdfMessageIds: Relationship.ToMany<USDFMessageIdResource>
  vods: Relationship.ToMany<VODResource>
  tags: Relationship.ToMany<typeof tag>
  scheduleItems: Relationship.ToMany<ScheduleItemResource>
  participants: Relationship.ToMany<ParticipantResource>
  organisation: Relationship.ToOne<OrganisationResource>
}

export type ScheduleSessionResource = ResourceFormatter<
  ScheduleSessionType,
  ScheduleSessionFields
>
