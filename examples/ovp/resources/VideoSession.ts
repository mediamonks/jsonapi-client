import { array, isBoolean, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Channel from './Channel'
import Discipline from './Discipline'
import EventUnit from './EventUnit'
import Stream from './Stream'
import TimelineMarker from './TimelineMarker'
import USDFMessageId from './USDFMessageId'

export type FieldOfPlay = Static<typeof isFieldOfPlay>

export const isFieldOfPlay = shape({
  total: isString,
  name: isString,
})

export type EventStage = Static<typeof isEventStage>

const isEventStage = shape({
  name: isString,
  phase: isString,
  startTime: isString,
  endTime: isString,
})

export type EventSession = Static<typeof isEventSession>

export const isEventSession = shape({
  name: isString,
  type: isString,
  venueCode: isString,
  startTime: isString,
  endTime: isString,
  stages: array(isEventStage),
})

export default class VideoSession extends JSONAPI.resource('VideoSession', 'video-sessions')<
  VideoSession
> {
  @Attribute.required(isString) public externalId!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public broadcastStart!: string
  @Attribute.required(isString) public broadcastEnd!: string
  @Attribute.required(isString) public coverageStart!: string
  @Attribute.required(isString) public coverageEnd!: string
  @Attribute.required(isBoolean) public live!: boolean
  @Attribute.required(isString) public runUpTime!: string
  @Attribute.required(isString) public runDownTime!: string
  @Attribute.optional(isBoolean) public unilateral!: boolean | null
  @Attribute.required(isString) public videoFeed!: string
  @Attribute.required(isBoolean) public integrated!: boolean
  @Attribute.required(isString) public videoId!: string
  @Attribute.optional(array(isFieldOfPlay)) public fieldsOfPlay!: Array<FieldOfPlay> | null
  @Attribute.optional(isEventSession) public eventSession!: EventSession | null
  @Attribute.optional(isString) public broadcastPublished!: string | null
  @Attribute.optional(isString) public broadcastUnpublished!: string | null
  @Relationship.toOne(() => Channel) public channel!: Channel | null
  @Relationship.toOne(() => Stream) public stream!: Stream | null
  @Relationship.toMany(() => TimelineMarker)
  public timelineMarkers!: TimelineMarker[]
  @Relationship.toMany(() => EventUnit) public eventUnits!: EventUnit[]
  @Relationship.toMany(() => USDFMessageId) public usdfMessageIds!: USDFMessageId[]
  @Relationship.toOne(() => Discipline) public discipline!: Discipline | null
}
