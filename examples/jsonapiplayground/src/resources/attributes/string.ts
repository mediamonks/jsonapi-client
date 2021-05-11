import { isString } from 'isntnt'
import { Type } from '@mediamonks/jsonapi-client'

export const string = Type.is('a string', isString)
