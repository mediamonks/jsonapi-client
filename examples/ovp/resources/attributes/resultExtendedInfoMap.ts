import { Type } from 'jsonapi-client'

export type ResultExtendedInfoMap = {}

export const resultExtendedInfoMap: Type<ResultExtendedInfoMap> = Type.shape(
  'a ResultExtendedInfoMap object',
  {},
)
