import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { string, number } from '../attributes/primitive'
import { eventUnit } from './eventUnit'
import { phase } from './phase'
import { scheduleSession } from './scheduleSession'
import { tag } from './tag'

export type TimelineMarkerType = 'TimelineMarker'

export type TimelineMarkerFields = {
  timelineMarkerType: Attribute.Optional<string>
  title: Attribute.Optional<string>
  description: Attribute.Optional<string>
  statistics: Attribute.Optional<{}>
  timestamp: Attribute.Optional<number>
  timeDelta: Attribute.Optional<number>
  scheduleSession: Relationship.ToOne<typeof scheduleSession>
  eventUnit: Relationship.ToOne<typeof eventUnit>
  phase: Relationship.ToOne<typeof phase>
  tags: Relationship.ToMany<typeof tag>
}

export type TimelineMarkerResource = ResourceFormatter<TimelineMarkerType, TimelineMarkerFields>

export const timelineMarker: TimelineMarkerResource = jsonapi.resource('TimelineMarker', {
  timelineMarkerType: Attribute.optional(string),
  title: Attribute.optional(string),
  description: Attribute.optional(string),
  statistics: Attribute.optional(Type.object),
  timestamp: Attribute.optional(number),
  timeDelta: Attribute.optional(number),
  scheduleSession: Relationship.toOne(() => [scheduleSession]),
  eventUnit: Relationship.toOne(() => [eventUnit]),
  phase: Relationship.toOne(() => [phase]),
  tags: Relationship.toMany(() => [tag]),
})
