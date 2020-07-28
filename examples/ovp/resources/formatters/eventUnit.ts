import jsonapi, { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import {
  EventUnitScheduleStatus,
  eventUnitScheduleStatus,
} from '../attributes/eventUnitScheduleStatus'
import { string } from '../attributes/primitive'
import { competitor } from './competitor'
import { medal } from './medal'
import { participant } from './participant'
import { PhaseResource, phase } from './phase'
import { scheduleItem } from './scheduleItem'
import { tag } from './tag'
import { vod } from './vod'

export type EventUnitResource = ResourceFormatter<
  'EventUnit',
  {
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    scheduleStatus: Attribute.Optional<EventUnitScheduleStatus>
    start: Attribute.Optional<string, Date>
    end: Attribute.Optional<string, Date>
    phase: Relationship.ToOne<PhaseResource>
    highlightVod: Relationship.ToOne<typeof vod>
    competitors: Relationship.ToMany<typeof competitor>
    participants: Relationship.ToMany<typeof participant>
    medals: Relationship.ToMany<typeof medal>
    scheduleItems: Relationship.ToMany<typeof scheduleItem>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const eventUnit: EventUnitResource = jsonapi.formatter('EventUnit', {
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  scheduleStatus: Attribute.optional(eventUnitScheduleStatus),
  start: Attribute.optional(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  phase: Relationship.toOne(() => [phase]),
  highlightVod: Relationship.toOne(() => [vod]),
  competitors: Relationship.toMany(() => [competitor]),
  participants: Relationship.toMany(() => [participant]),
  medals: Relationship.toMany(() => [medal]),
  scheduleItems: Relationship.toMany(() => [scheduleItem]),
  tags: Relationship.toMany(() => [tag]),
})
