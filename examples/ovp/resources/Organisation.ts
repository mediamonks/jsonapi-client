import { isString, isUint, shape, Static } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Asset from './Asset'
import Country from './Country'

export type OrganisationStatistics = Static<typeof isOrganisationStatistics>

export const isOrganisationStatistics = shape({
  total: isUint,
  gold: isUint,
  silver: isUint,
  bronze: isUint,
  goldRank: isUint,
  totalRank: isUint,
  populationGoldRank: isUint,
  populationTotalRank: isUint,
  previousGoldRank: isUint,
  previousTotalRank: isUint,
})

export default class Organisation extends JSONAPI.resource('Organisation', 'organisations')<
  Organisation
> {
  @Attribute.required(isString) public name!: string
  @Attribute.required(isString) public externalId!: string
  @Attribute.required(isOrganisationStatistics) public statistics!: OrganisationStatistics
  @Relationship.toOne(() => Country) public country!: Country | null
  @Relationship.toOne(() => Asset) public flag!: Asset | null
}
