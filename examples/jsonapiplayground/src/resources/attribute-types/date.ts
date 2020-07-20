import { test } from 'isntnt'

const serializeYearMonthDayDate = (date: Date): string =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0')].join('-')

export const isDateString = test(/^\d{4}(-\d{2}){2}$/)

export const dateFormatter = {
  serialize: serializeYearMonthDayDate,
  deserialize: (value: string) => new Date(value),
}
