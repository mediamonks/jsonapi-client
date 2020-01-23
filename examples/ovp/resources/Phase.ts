import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Competitor } from './Competitor'
import { EventUnit } from './EventUnit'
import { Stage } from './Stage'

export class Phase extends JSONAPI.resource('Phase')<Phase> {
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public startDate!: string
  @Relationship.toMany(() => EventUnit) public eventUnits!: EventUnit[]
  @Relationship.toOne(() => Stage) public stage!: Stage | null
  @Relationship.toMany(() => Competitor) public competitors!: Competitor[]
}
