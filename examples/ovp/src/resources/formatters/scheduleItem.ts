import jsonapi, { Attribute, Relationship, ResourceFormatter, ResourceId } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { string } from '../attributes/primitive'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { participant } from './participant'
import { phase } from './phase'
import { stage } from './stage'

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
    participants: Relationship.ToMany<typeof participant>
    eventUnits: Relationship.ToMany<typeof eventUnit>
    events: Relationship.ToMany<typeof event>
    phases: Relationship.ToMany<typeof phase>
    stages: Relationship.ToMany<typeof stage>
  }
>

export const scheduleItem: ScheduleItemResource = jsonapi.formatter('ScheduleItem', {
  title: Attribute.required(string),
  start: Attribute.required(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  finishType: Attribute.optional(string),
  awardClass: Attribute.optional(string),
  awardSubClass: Attribute.optional(string),
  scheduleSessionId: Attribute.optional(string),
  events: Relationship.toMany(() => [event]),
  eventUnits: Relationship.toMany(() => [eventUnit]),
  phases: Relationship.toMany(() => [phase]),
  stages: Relationship.toMany(() => [stage]),
  participants: Relationship.toMany(() => [participant]),
})
