import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { uint } from '../attributes/primitive'
import { country, CountryResource } from './country'
import { discipline, DisciplineResource } from './discipline'
import { organisation, OrganisationResource } from './organisation'

export type MedalCountResource = ResourceFormatter<
  'MedalCount',
  {
    bronze: Attribute.Required<number>
    silver: Attribute.Required<number>
    gold: Attribute.Required<number>
    total: Attribute.Required<number>
    goldRank: Attribute.Required<number>
    totalRank: Attribute.Required<number>
    discipline: Relationship.ToOne<DisciplineResource>
    organisation: Relationship.ToOne<OrganisationResource>
    country: Relationship.ToOne<CountryResource>
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
