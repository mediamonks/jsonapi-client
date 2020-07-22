import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { country } from './country'
import { discipline } from './discipline'
import { OrganisationResource } from './organisation'

export type MedalCountType = 'MedalCount'

export type MedalCountFields = {
  bronze: Attribute.Required<number>
  silver: Attribute.Required<number>
  gold: Attribute.Required<number>
  total: Attribute.Required<number>
  goldRank: Attribute.Required<number>
  totalRank: Attribute.Required<number>
  country: Relationship.ToOne<typeof country>
  organisation: Relationship.ToOne<OrganisationResource>
  discipline: Relationship.ToOne<typeof discipline>
}

export type MedalCountResource = ResourceFormatter<
  MedalCountType,
  MedalCountFields
>
