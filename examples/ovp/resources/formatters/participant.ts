import jsonapi, { Attribute, Relationship, ResourceFormatter, Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'
import { country } from './country'
import { discipline } from './discipline'
import { individual } from './individual'
import { organisation } from './organisation'
import { scheduleSession } from './scheduleSession'

export type ParticipantType = 'Participant'

export type ParticipantFields = {
  participantType: Attribute.Required<string>
  name: Attribute.Required<string>
  statistics: Attribute.Optional<{}>
  individual: Relationship.ToOneRequired<typeof individual>
  discipline: Relationship.ToOneRequired<typeof discipline>
  organisation: Relationship.ToOneRequired<typeof organisation>
  country: Relationship.ToOne<typeof country>
  scheduleSessions: Relationship.ToMany<typeof scheduleSession>
  participants: Relationship.ToMany<typeof participant>
}

export type ParticipantResource = ResourceFormatter<ParticipantType, ParticipantFields>

export const participant: ParticipantResource = jsonapi.resource('Participant', {
  participantType: Attribute.required(string),
  name: Attribute.required(string),
  statistics: Attribute.optional(Type.object),
  individual: Relationship.toOneRequired(() => [individual]),
  discipline: Relationship.toOneRequired(() => [discipline]),
  organisation: Relationship.toOneRequired(() => [organisation]),
  country: Relationship.toOne(() => [country]),
  scheduleSessions: Relationship.toMany(() => [scheduleSession]),
  participants: Relationship.toMany(() => [participant]),
})
