import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { uint } from '../attributes/primitive'
import { country } from './country'
import { discipline } from './discipline'
import { organisation } from './organisation'

export type MedalCountResource = ResourceFormatter<
  'MedalCount',
  {
    bronze: Attribute.Required<number>
    silver: Attribute.Required<number>
    gold: Attribute.Required<number>
    total: Attribute.Required<number>
    goldRank: Attribute.Required<number>
    totalRank: Attribute.Required<number>
    discipline: Relationship.ToOne<typeof discipline>
    organisation: Relationship.ToOne<typeof organisation>
    country: Relationship.ToOne<typeof country>
  }
>

export const medalCount: MedalCountResource = new ResourceFormatter('MedalCount', {
  bronze: Attribute.required(uint),
  silver: Attribute.required(uint),
  gold: Attribute.required(uint),
  total: Attribute.required(uint),
  goldRank: Attribute.required(uint),
  totalRank: Attribute.required(uint),
  discipline: Relationship.toOne(() => discipline),
  organisation: Relationship.toOne(() => organisation),
  country: Relationship.toOne(() => country),
})
