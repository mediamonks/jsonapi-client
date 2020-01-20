import { isNumber, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Asset } from './Asset'
import { Event } from './Event'
import { Participant } from './Participant'
import { isDisciplineStatistics, DisciplineStatistics } from './Resource.utils'

export class Discipline extends JSONAPI.resource('Discipline')<Discipline> {
  @Attribute.required(isString) public name!: string
  @Attribute.required(isString) public externalId!: string
  @Attribute.required(isNumber) public eventCount!: number
  @Attribute.optional(isDisciplineStatistics) public statistics!: DisciplineStatistics | null
  @Relationship.toMany(() => Participant) public participants!: Participant[]
  @Relationship.toMany(() => Event) public events!: Event[]
  @Relationship.toOne(() => Asset) public thumbnail!: Asset | null
}
