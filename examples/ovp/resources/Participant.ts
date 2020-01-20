import { isNumber, isString, shape, Static } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Country } from './Country'
import { Discipline } from './Discipline'
import { Individual } from './Individual'

const isStatistics = shape({
  total: isNumber,
  gold: isNumber,
  silver: isNumber,
  bronze: isNumber,
})

export class Participant extends JSONAPI.resource('Participant')<Participant> {
  @Attribute.required(isString) public participantType!: string
  @Attribute.required(isString) public name!: string
  @Attribute.optional(isStatistics) public statistics!: Static<typeof isStatistics> | null
  @Relationship.toMany(() => Participant) public participants!: Participant[]
  @Relationship.toMany(() => Discipline) public disciplines!: Discipline[]
  @Relationship.toOne(() => Country) public country!: Country | null
  @Relationship.toOne(() => Individual) public individual!: Individual | null
}
