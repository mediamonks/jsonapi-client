import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { medalStatistics, MedalStatistics } from '../attributes/medalStatistics'
import { participantType, ParticipantType } from '../attributes/participantType'
import { string } from '../attributes/primitive'
import { country } from './country'
import { discipline } from './discipline'
import { individual } from './individual'
import { organisation } from './organisation'
import { scheduleSession } from './scheduleSession'

export type ParticipantResource = ResourceFormatter<
  'Participant',
  {
    participantType: Attribute.Required<ParticipantType>
    name: Attribute.Required<string>
    statistics: Attribute.Optional<MedalStatistics>
    individual: Relationship.ToOneRequired<typeof individual>
    discipline: Relationship.ToOne<typeof discipline>
    organisation: Relationship.ToOne<typeof organisation>
    country: Relationship.ToOne<typeof country>
    scheduleSessions: Relationship.ToMany<typeof scheduleSession>
    participants: Relationship.ToMany<typeof participant>
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
