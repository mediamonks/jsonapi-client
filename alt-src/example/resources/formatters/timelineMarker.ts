import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { number, string } from '../attributes/primitive'
import {
  timelineMarkerStatistics,
  TimelineMarkerStatistics,
} from '../attributes/timelineMarkerStatistics'
import { timelineMarkerType, TimelineMarkerType } from '../attributes/timelineMarkerType'
import { eventUnit } from './eventUnit'
import { phase } from './phase'
import { scheduleSession } from './scheduleSession'
import { tag } from './tag'

export type TimelineMarkerResource = ResourceFormatter<
  'TimelineMarker',
  {
    timelineMarkerType: Attribute.Optional<TimelineMarkerType>
    title: Attribute.Optional<string>
    description: Attribute.Optional<string>
    statistics: Attribute.Optional<TimelineMarkerStatistics>
    timestamp: Attribute.Optional<number>
    timeDelta: Attribute.Optional<number>
    scheduleSession: Relationship.ToOne<typeof scheduleSession>
    eventUnit: Relationship.ToOne<typeof eventUnit>
    phase: Relationship.ToOne<typeof phase>
    tags: Relationship.ToMany<typeof tag>
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
