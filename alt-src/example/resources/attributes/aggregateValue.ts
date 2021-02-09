import { isNumber, or, shape, Static } from 'isntnt'
import { Type } from '../../../index'

import { isoDateString } from './date'

const isDisciplineDayAggregate = shape({
  eventUnits: isNumber,
  totalMedalCount: isNumber,
  completedMedalCount: isNumber,
})

const isOlympicDayAggregate = shape({
  endDate: isoDateString.predicate,
  startDate: isoDateString.predicate,
  eventCount: isNumber,
  medalCount: isNumber,
  organisationCount: isNumber,
})

const isAggregateValue = or(isDisciplineDayAggregate, isOlympicDayAggregate)

export type AggregateValue = Static<typeof isAggregateValue>

export const aggregateValue: Type<AggregateValue> = Type.is(
  'a DisciplineDayAggregate or OlympicDayAggregate object',
  isAggregateValue,
)
