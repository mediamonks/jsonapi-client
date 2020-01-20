import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Asset } from './Asset'
import { Country } from './Country'
import { isOrganisationStatistics, OrganisationStatistics } from './Resource.utils'

export class Organisation extends JSONAPI.resource('Organisation')<Organisation> {
  @Attribute.required(isString) public name!: string
  @Attribute.required(isString) public externalId!: string
  @Attribute.required(isOrganisationStatistics) public statistics!: OrganisationStatistics
  @Relationship.toOne(() => Country) public country!: Country | null
  @Relationship.toOne(() => Asset) public flag!: Asset | null
}
