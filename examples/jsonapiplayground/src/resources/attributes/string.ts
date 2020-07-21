import { isString } from 'isntnt'
import { Type } from 'jsonapi-client'

export const string = Type.is('a string', isString)
