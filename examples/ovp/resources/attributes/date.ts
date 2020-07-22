import { Type } from 'jsonapi-client'

export const isoDateString: Type<string> = Type.is(
  'a date string',
  (value: unknown): value is string =>
    new Date(String(value)).toISOString() === value,
)

export const isoDateStringFormatter = {
  serialize: (date: Date) => date.toISOString(),
  deserialize: (value: string) => new Date(value),
}
