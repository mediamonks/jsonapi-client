import JSONAPI, {
  Attribute,
  Relationship,
  ResourceFormatter,
} from 'jsonapi-client'

import { country } from './country'
import { discipline } from './discipline'
import { individual } from './individual'
import { OrganisationResource } from './organisation'
import { ScheduleSessionResource } from './scheduleSession'

export type ParticipantType = 'Participant'

export type ParticipantFields = {
  participantType: Attribute.Required<string>
  name: Attribute.Required<string>
  statistics: Attribute.Optional<{}>
  scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
  participants: Relationship.ToMany<ParticipantResource>
  discipline: Relationship.ToOne<typeof discipline>
  country: Relationship.ToOne<typeof country>
  organisation: Relationship.ToOne<OrganisationResource>
  individual: Relationship.ToOne<typeof individual>
}

export type ParticipantResource = ResourceFormatter<
  ParticipantType,
  ParticipantFields
>

export const participant: ParticipantResource = JSONAPI.resource(
  'Participant',
  {} as any,
)
