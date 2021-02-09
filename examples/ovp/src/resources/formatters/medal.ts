import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { medalType, MedalType } from '../attributes/medalType'
import { boolean, string, uint } from '../attributes/primitive'
import { competitor, CompetitorResource } from './competitor'
import { event, EventResource } from './event'
import { eventUnit, EventUnitResource } from './eventUnit'
import { organisation, OrganisationResource } from './organisation'
import { participant, ParticipantResource } from './participant'

export type MedalResource = ResourceFormatter<
  'Medal',
  {
    externalId: Attribute.Optional<string>
    medalType: Attribute.Required<MedalType>
    description: Attribute.Required<string>
    perpetual: Attribute.Required<boolean>
    determinedDate: Attribute.Optional<string, Date>
    year: Attribute.Optional<number>
    event: Relationship.ToOne<EventResource>
    eventUnit: Relationship.ToOne<EventUnitResource>
    competitor: Relationship.ToOne<CompetitorResource>
    participant: Relationship.ToOne<ParticipantResource>
    organisation: Relationship.ToOne<OrganisationResource>
  }
>

export const medal: MedalResource = new ResourceFormatter('Medal', {
  externalId: Attribute.optional(string),
  medalType: Attribute.required(medalType),
  description: Attribute.required(string),
  perpetual: Attribute.required(boolean),
  determinedDate: Attribute.optional(isoDateString, isoDateStringFormatter),
  year: Attribute.optional(uint),
  event: Relationship.toOne(() => event),
  eventUnit: Relationship.toOne(() => eventUnit),
  competitor: Relationship.toOne(() => competitor),
  participant: Relationship.toOne(() => participant),
  organisation: Relationship.toOne(() => organisation),
})
