import { isBoolean, isNumber, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Discipline } from './Discipline'
import { ScheduleItem } from './ScheduleItem'
import { VideoSession } from './VideoSession'

export class ScheduleSession extends JSONAPI.resource('ScheduleSession')<ScheduleSession> {
  @Attribute.required(isString) public externalId!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public code!: string
  @Attribute.optional(isString) public disciplineCode!: string | null
  @Attribute.optional(isString) public disciplineId!: string | null
  @Attribute.required(isString) public start!: string
  @Attribute.optional(isString) public end!: string | null
  @Attribute.optional(isString) public competitionDate!: string | null
  @Attribute.optional(isNumber) public scheduleItemCount!: number | null
  @Attribute.required(isBoolean) public awardIndicator!: boolean
  @Relationship.toOne(() => Discipline) public discipline!: Discipline | null
  @Relationship.toMany(() => VideoSession) public videoSessions!: VideoSession[]
  @Relationship.toMany(() => ScheduleItem) public scheduleItems!: ScheduleItem[]
}
