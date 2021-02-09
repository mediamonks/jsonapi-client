import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { number, string } from '../attributes/primitive'
import {
  timelineMarkerStatistics,
  TimelineMarkerStatistics,
} from '../attributes/timelineMarkerStatistics'
import { timelineMarkerType, TimelineMarkerType } from '../attributes/timelineMarkerType'
import { eventUnit, EventUnitResource } from './eventUnit'
import { phase, PhaseResource } from './phase'
import { scheduleSession, ScheduleSessionResource } from './scheduleSession'
import { tag, TagResource } from './tag'

export type TimelineMarkerResource = ResourceFormatter<
  'TimelineMarker',
  {
    timelineMarkerType: Attribute.Optional<TimelineMarkerType>
    title: Attribute.Optional<string>
    description: Attribute.Optional<string>
    statistics: Attribute.Optional<TimelineMarkerStatistics>
    timestamp: Attribute.Optional<number>
    timeDelta: Attribute.Optional<number>
    scheduleSession: Relationship.ToOne<ScheduleSessionResource>
    eventUnit: Relationship.ToOne<EventUnitResource>
    phase: Relationship.ToOne<PhaseResource>
    tags: Relationship.ToMany<TagResource>
  }
>

export const timelineMarker: TimelineMarkerResource = new ResourceFormatter('TimelineMarker', {
  timelineMarkerType: Attribute.optional(timelineMarkerType),
  title: Attribute.optional(string),
  description: Attribute.optional(string),
  statistics: Attribute.optional(timelineMarkerStatistics),
  timestamp: Attribute.optional(number),
  timeDelta: Attribute.optional(number),
  scheduleSession: Relationship.toOne(() => scheduleSession),
  eventUnit: Relationship.toOne(() => eventUnit),
  phase: Relationship.toOne(() => phase),
  tags: Relationship.toMany(() => tag),
})
