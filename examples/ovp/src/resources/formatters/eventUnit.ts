import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import {
  EventUnitScheduleStatus,
  eventUnitScheduleStatus,
} from '../attributes/eventUnitScheduleStatus'
import { string } from '../attributes/primitive'
import { competitor, CompetitorResource } from './competitor'
import { medal, MedalResource } from './medal'
import { participant, ParticipantResource } from './participant'
import { PhaseResource, phase } from './phase'
import { scheduleItem, ScheduleItemResource } from './scheduleItem'
import { tag, TagResource } from './tag'
import { vod, VODResource } from './vod'

export type EventUnitResource = ResourceFormatter<
  'EventUnit',
  {
    externalId: Attribute.Optional<string>
    title: Attribute.Required<string>
    scheduleStatus: Attribute.Optional<EventUnitScheduleStatus>
    start: Attribute.Optional<string, Date>
    end: Attribute.Optional<string, Date>
    phase: Relationship.ToOne<PhaseResource>
    highlightVod: Relationship.ToOne<VODResource>
    competitors: Relationship.ToMany<CompetitorResource>
    participants: Relationship.ToMany<ParticipantResource>
    medals: Relationship.ToMany<MedalResource>
    scheduleItems: Relationship.ToMany<ScheduleItemResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const eventUnit: EventUnitResource = new ResourceFormatter('EventUnit', {
  externalId: Attribute.optional(string),
  title: Attribute.required(string),
  scheduleStatus: Attribute.optional(eventUnitScheduleStatus),
  start: Attribute.optional(isoDateString, isoDateStringFormatter),
  end: Attribute.optional(isoDateString, isoDateStringFormatter),
  phase: Relationship.toOne(() => phase),
  highlightVod: Relationship.toOne(() => vod),
  competitors: Relationship.toMany(() => competitor),
  participants: Relationship.toMany(() => participant),
  medals: Relationship.toMany(() => medal),
  scheduleItems: Relationship.toMany(() => scheduleItem),
  tags: Relationship.toMany(() => tag),
})
