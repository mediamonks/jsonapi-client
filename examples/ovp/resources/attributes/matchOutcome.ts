import { Type } from 'jsonapi-client'

export enum MatchOutcome {
  Won = 'WON',
  Lost = 'LOST',
  Toss = 'TOSS',
}

export const matchOutcome: Type<MatchOutcome> = Type.either(...Object.values(MatchOutcome))
