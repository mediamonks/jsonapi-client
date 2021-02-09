import { Type } from '../../../index'

export type TimelineMarkerStatistics = {}

export const timelineMarkerStatistics: Type<TimelineMarkerStatistics> = Type.shape(
  'a TimelineMarkerStatistics object',
  {},
)
