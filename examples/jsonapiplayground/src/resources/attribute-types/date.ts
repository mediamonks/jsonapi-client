import { test } from 'isntnt'
import { Type } from '../../../../../src'

const serializeYearMonthDayDate = (date: Date): string =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0')].join('-')

export const dateString = Type.is('a date string', test(/^\d{4}(-\d{2}){2}$/))

export const dateStringFormatter = {
  serialize: serializeYearMonthDayDate,
  deserialize: (value: string) => new Date(value),
}
