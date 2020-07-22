import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { eventUnit } from './eventUnit'
import { PhaseResource } from './phase'
import { ScheduleSessionResource } from './scheduleSession'
import { tag } from './tag'

export type TimelineMarkerType = 'TimelineMarker'

export type TimelineMarkerFields = {
  timelineMarkerType: Attribute.Optional<string>
  title: Attribute.Optional<string>
  description: Attribute.Optional<string>
  statistics: Attribute.Optional<{}>
  timestamp: Attribute.Optional<number>
  timeDelta: Attribute.Optional<number>
  scheduleSession: Relationship.ToOne<ScheduleSessionResource>
  eventUnit: Relationship.ToOne<typeof eventUnit>
  phase: Relationship.ToOne<PhaseResource>
  tags: Relationship.ToMany<typeof tag>
}

export type TimelineMarkerResource = ResourceFormatter<
  TimelineMarkerType,
  TimelineMarkerFields
>
