import { Type } from '../../../../../src'

export enum AggregateType {
  DisciplineDay = 'DISCIPLINE_DAY',
  OlympicDay = 'OLYMPIC_DAY',
}

export const aggregateType: Type<AggregateType> = Type.either(...Object.values(AggregateType))
