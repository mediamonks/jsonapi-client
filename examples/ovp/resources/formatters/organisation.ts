import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { asset } from './asset'
import { country } from './country'
import { medalCount } from './medalCount'
import { scheduleSession } from './scheduleSession'
import { tag } from './tag'

export type OrganisationType = 'Organisation'

export type OrganisationFields = {
  externalId: Attribute.Required<string>
  name: Attribute.Required<string>
  description: Attribute.Optional<string>
  statistics: Attribute.Required<{}>
  country: Relationship.ToOne<typeof country>
  flag: Relationship.ToOne<typeof asset>
  medalCounts: Relationship.ToOne<typeof medalCount>
  scheduleSessions: Relationship.ToMany<typeof scheduleSession>
  tags: Relationship.ToMany<typeof tag>
}

export type OrganisationResource = ResourceFormatter<OrganisationType, OrganisationFields>

export const organisation: OrganisationResource = jsonapi.resource('Organisation', {
  externalId: Attribute.required(string),
  name: Attribute.required(string),
  description: Attribute.optional(string),
  statistics: Attribute.required(Type.object),
  country: Relationship.toOne(() => [country]),
  flag: Relationship.toOne(() => [asset]),
  medalCounts: Relationship.toOne(() => [medalCount]),
  scheduleSessions: Relationship.toMany(() => [scheduleSession]),
  tags: Relationship.toMany(() => [tag]),
})
