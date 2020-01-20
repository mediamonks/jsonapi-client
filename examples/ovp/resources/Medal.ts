import { isBoolean, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Competitor } from './Competitor'
import { Event } from './Event'
import { EventUnit } from './EventUnit'
import { Participant } from './Participant'

export class Medal extends JSONAPI.resource('Medal')<Medal> {
  @Attribute.required(isString) public medalType!: string
  @Attribute.optional(isString) public determinedDate!: string | null
  @Attribute.required(isBoolean) public perpetual!: boolean
  @Relationship.toOne(() => Event) public event!: Event | null
  @Relationship.toOne(() => EventUnit) public eventUnit!: EventUnit | null
  @Relationship.toOne(() => Competitor) public competitor!: Competitor | null
  @Relationship.toOne(() => Participant) public participant!: Participant | null
}