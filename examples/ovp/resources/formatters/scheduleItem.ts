import {
  Attribute,
  Relationship,
  ResourceFormatter,
  ResourceId,
} from 'jsonapi-client'

import { event } from './event'
import { eventUnit } from './eventUnit'
import { ParticipantResource } from './participant'
import { PhaseResource } from './phase'
import { StageResource } from './stage'

export type ScheduleItemType = 'ScheduleItem'

export type ScheduleItemFields = {
  title: Attribute.Required<string>
  start: Attribute.Required<string, Date>
  end: Attribute.Optional<string, Date>
  finishType: Attribute.Optional<string>
  awardClass: Attribute.Optional<string>
  awardSubClass: Attribute.Optional<string>
  scheduleSessionId: Attribute.Optional<ResourceId>
  participants: Relationship.ToMany<ParticipantResource>
  eventUnits: Relationship.ToMany<typeof eventUnit>
  events: Relationship.ToMany<typeof event>
  phases: Relationship.ToMany<PhaseResource>
  stages: Relationship.ToMany<StageResource>
}

export type ScheduleItemResource = ResourceFormatter<
  ScheduleItemType,
  ScheduleItemFields
>
