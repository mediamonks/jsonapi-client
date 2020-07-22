import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { asset } from './asset'
import { country } from './country'
import { MedalCountResource } from './medalCount'
import { ScheduleSessionResource } from './scheduleSession'
import { TagResource } from './Tag'

export type OrganisationType = 'Organisation'

export type OrganisationFields = {
  externalId: Attribute.Required<string>
  name: Attribute.Required<string>
  description: Attribute.Optional<string>
  statistics: Attribute.Required<{}>
  country: Relationship.ToOne<typeof country>
  flag: Relationship.ToOne<typeof asset>
  medalCounts: Relationship.ToOne<MedalCountResource>
  tags: Relationship.ToMany<TagResource>
  scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
}

export type OrganisationResource = ResourceFormatter<OrganisationType, OrganisationFields>

export const organisation: OrganisationResource = {} as any
