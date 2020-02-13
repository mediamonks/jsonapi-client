import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Event from './Event'
import EventUnit from './EventUnit'
import Medal from './Medal'
import Participant from './Participant'
import Phase from './Phase'
import Result from './Result'
import Stage from './Stage'

export default class Competitor extends JSONAPI.resource('Competitor', 'competitor')<Competitor> {
  @Attribute.optional(isString) public externalId!: string | null
  @Relationship.toOne(() => Stage) public stage!: Stage | null
  @Relationship.toOne(() => Event) public event!: Event | null
  @Relationship.toMany(() => Medal) public medals!: Medal[]
  @Relationship.toMany(() => Result) public results!: Result[]
  @Relationship.toOne(() => Phase) public phase!: Phase | null
  @Relationship.toOne(() => EventUnit) public eventUnit!: EventUnit | null
  @Relationship.toOne(() => Participant) public participant!: Participant | null
}
