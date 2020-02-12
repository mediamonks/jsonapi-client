import { isNumber, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import EventUnit from './EventUnit'
import Phase from './Phase'
import VideoSession from './VideoSession'

export default class TimelineMarker extends JSONAPI.resource('TimelineMarker', 'timeline-markers')<
  TimelineMarker
> {
  @Attribute.required(isString) public timelineMarkerType!: string
  @Attribute.optional(isString) public title!: string | null
  @Attribute.optional(isString) public description!: string | null
  @Attribute.optional(isString) public statistics!: string | null
  @Attribute.optional(isString) public timestamp!: string | null
  @Attribute.optional(isNumber) public timeDelta!: number | null
  @Relationship.toOne(() => VideoSession) public videoSession!: VideoSession | null
  @Relationship.toOne(() => EventUnit) public eventUnit!: EventUnit | null
  @Relationship.toOne(() => Phase) public phase!: Phase | null
}
