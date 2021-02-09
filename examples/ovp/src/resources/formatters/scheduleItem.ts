import { Attribute, Relationship, ResourceFormatter, ResourceId } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { event, EventResource } from './event'
import { eventUnit, EventUnitResource } from './eventUnit'
import { participant, ParticipantResource } from './participant'
import { phase, PhaseResource } from './phase'
import { stage, StageResource } from './stage'

export type ScheduleItemResource = ResourceFormatter<
  'ScheduleItem',
  {
    title: Attribute.Required<string>
    start: Attribute.Required<string, Date>
    end: Attribute.Optional<string, Date>
    finishType: Attribute.Optional<string>
    awardClass: Attribute.Optional<string>
    awardSubClass: Attribute.Optional<string>
    scheduleSessionId: Attribute.Optional<ResourceId>
    participants: Relationship.ToMany<ParticipantResource>
    eventUnits: Relationship.ToMany<EventUnitResource>
    events: Relationship.ToMany<EventResource>
    phases: Relationship.ToMany<PhaseResource>
    stages: Relationship.ToMany<StageResource>
  }
>

export const scheduleItem: ScheduleItemResource = new ResourceFormatter('ScheduleItem', {
  title: Attribute.required(string),
  start: Attribute.required(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  finishType: Attribute.optional(string),
  awardClass: Attribute.optional(string),
  awardSubClass: Attribute.optional(string),
  scheduleSessionId: Attribute.optional(string),
  events: Relationship.toMany(() => event),
  eventUnits: Relationship.toMany(() => eventUnit),
  phases: Relationship.toMany(() => phase),
  stages: Relationship.toMany(() => stage),
  participants: Relationship.toMany(() => participant),
})
