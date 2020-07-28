import { array, isString, isUint, nullable, shape, Static } from 'isntnt'
import { Type } from '../../../../../src'

import { matchOutcome } from './matchOutcome'

const isRoundUnitCompetitor = shape({
  code: nullable(isString),
  wlt: matchOutcome.predicate,
  pos: isString,
  sortOrder: isUint,
  competitor: nullable(
    shape({
      competitorId: isString,
      organisationId: isString,
    }),
  ),
})

const isBracketUnitId = shape({
  phase: isString,
  unitId: isString,
})

const isBracketRoundUnit = shape({
  code: isString,
  order: isUint,
  sortOrder: isUint,
  competitors: array(isRoundUnitCompetitor),
  unitId: isString,
  winnerGoesToUnitId: isBracketUnitId,
  date: nullable(isString),
  time: nullable(isString),
  result: nullable(isString),
})

const isStageBracketRound = shape({
  code: isString,
  title: isString,
  units: array(isBracketRoundUnit),
})

const isStageBracket = shape({
  bracketRounds: array(isStageBracketRound),
  code: isString,
  title: isString,
})

export type StageBracket = Static<typeof isStageBracket>

export const stageBracket: Type<StageBracket> = Type.is('a Bracket object', isStageBracket)

export type StageBrackets = Array<StageBracket>

export const stageBrackets: Type<StageBrackets> = Type.array(stageBracket)
