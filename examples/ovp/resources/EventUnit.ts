import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Competitor } from './Competitor'
import { Medal } from './Medal'
import { Phase } from './Phase'
import { VideoSession } from './VideoSession'

export class EventUnit extends JSONAPI.resource('EventUnit')<EventUnit> {
  @Attribute.optional(isString) public externalId!: string | null
  @Attribute.required(isString) public title!: string
  @Attribute.optional(isString) public start!: string | null
  @Attribute.optional(isString) public end!: string | null
  @Attribute.optional(isString) public scheduleStatus!: string | null
  @Relationship.toOne(() => Phase) public phase!: Phase | null
  // @Relationship.toMany(() => Medal) public medals!: Medal[] | null
  // @Relationship.toOne(() => VideoSession) public videoSession!: VideoSession | null
  // @Relationship.toMany(() => Competitor) public competitors!: Competitor[]
}
