import { Attribute, Relationship, ResourceFormatter } from 'jsonapi-client'

import { competitor } from './Competitor'
import { event } from './event'
import { eventUnit } from './eventUnit'
import { OrganisationResource } from './organisation'
import { ParticipantResource } from './participant'

export type MedalType = 'Medal'

export type MedalFields = {
  externalId: Attribute.Optional<string>
  medalType: Attribute.Required<string>
  perpetual: Attribute.Required<boolean>
  description: Attribute.Required<string>
  determinedDate: Attribute.Optional<string, Date>
  year: Attribute.Optional<number>
  event: Relationship.ToOne<typeof event>
  eventUnit: Relationship.ToOne<typeof eventUnit>
  competitor: Relationship.ToOne<typeof competitor>
  participant: Relationship.ToOne<ParticipantResource>
  organisation: Relationship.ToOne<OrganisationResource>
}

export type MedalResource = ResourceFormatter<MedalType, MedalFields>
