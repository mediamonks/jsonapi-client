import { isBoolean, isNumber, isString, isUint } from 'isntnt'
import { Type } from '../../../index'

export const boolean: Type<boolean> = Type.is('a boolean', isBoolean)

export const string: Type<string> = Type.is('a string', isString)

export const number: Type<number> = Type.is('a number', isNumber)

export const uint: Type<number> = Type.is('an unsigned integer', isUint)

export const falseOrNull: Type<false | null> = Type.either(false, null)
