import { isUint } from 'isntnt'
import { Type } from '@mediamonks/jsonapi-client'

export const uint = Type.is('an unsigned integer', isUint)
