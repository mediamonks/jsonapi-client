import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { medalStatistics, MedalStatistics } from '../attributes/medalStatistics'
import { participantType, ParticipantType } from '../attributes/participantType'
import { string } from '../attributes/primitive'
import { country, CountryResource } from './country'
import { discipline, DisciplineResource } from './discipline'
import { individual, IndividualResource } from './individual'
import { organisation, OrganisationResource } from './organisation'
import { scheduleSession, ScheduleSessionResource } from './scheduleSession'

export type ParticipantResource = ResourceFormatter<
  'Participant',
  {
    participantType: Attribute.Required<ParticipantType>
    name: Attribute.Required<string>
    statistics: Attribute.Optional<MedalStatistics>
    individual: Relationship.ToOneRequired<IndividualResource>
    discipline: Relationship.ToOne<DisciplineResource>
    organisation: Relationship.ToOne<OrganisationResource>
    country: Relationship.ToOne<CountryResource>
    scheduleSessions: Relationship.ToMany<ScheduleSessionResource>
    participants: Relationship.ToMany<ParticipantResource>
  }
>

export const participant: ParticipantResource = new ResourceFormatter('Participant', {
  participantType: Attribute.required(participantType),
  name: Attribute.required(string),
  statistics: Attribute.optional(medalStatistics),
  individual: Relationship.toOneRequired(() => individual),
  discipline: Relationship.toOne(() => discipline),
  organisation: Relationship.toOne(() => organisation),
  country: Relationship.toOne(() => country),
  scheduleSessions: Relationship.toMany(() => scheduleSession),
  participants: Relationship.toMany(() => participant),
})
