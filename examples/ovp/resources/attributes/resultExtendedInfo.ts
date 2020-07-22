import { Type } from 'jsonapi-client'

export type ResultExtendedInfo = {}

export const resultExtendedInfo: Type<ResultExtendedInfo> = Type.shape(
  'a ResultExtendedInfo object',
  {},
)
