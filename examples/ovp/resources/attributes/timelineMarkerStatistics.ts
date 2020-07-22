import { Type } from 'jsonapi-client'

export type TimelineMarkerStatistics = {}

export const timelineMarkerStatistics: Type<TimelineMarkerStatistics> = Type.shape(
  'a TimelineMarkerStatistics object',
  {},
)
