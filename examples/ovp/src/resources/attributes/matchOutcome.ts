import { Type } from '../../../../../src'

export enum MatchOutcome {
  Won = 'WON',
  Lost = 'LOST',
  Toss = 'TOSS',
}

export const matchOutcome: Type<MatchOutcome> = Type.either(...Object.values(MatchOutcome))
