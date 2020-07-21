import { isUint } from 'isntnt'
import { Type } from 'jsonapi-client'

export const uint = Type.is('an unsigned integer', isUint)
