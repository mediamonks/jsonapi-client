import { isNumber } from 'isntnt'
import { Type } from '../../../index'

export const isoDateString: Type<string> = Type.is(
  'a date string',
  (value: unknown): value is string => isNumber(new Date(String(value)).getTime()),
)

export const isoDateStringFormatter = {
  serialize: (date: Date) => date.toISOString(),
  deserialize: (value: string) => new Date(value),
}
