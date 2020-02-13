import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Competitor from './Competitor'
import Discipline from './Discipline'
import Medal from './Medal'
import Stage from './Stage'

export default class Event extends JSONAPI.resource('Event', 'events')<Event> {
  @Attribute.required(isString) public name!: string
  @Attribute.optional(isString) public externalId!: string | null
  @Relationship.toOne(() => Discipline) public discipline!: Discipline | null
  @Relationship.toMany(() => Stage) public stages!: Stage[]
  @Relationship.toMany(() => Medal) public medals!: Medal[]
  @Relationship.toMany(() => Competitor) public competitors!: Competitor[]
}
