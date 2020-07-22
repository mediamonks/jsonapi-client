import { Type } from 'jsonapi-client'

export enum ParticipantType {
  Team = 'TEAM',
  Individual = 'INDIVIDUAL',
}

export const participantType: Type<ParticipantType> = Type.either(...Object.values(ParticipantType))
