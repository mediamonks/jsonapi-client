import {
  isBoolean,
  isNumber,
  isSerializableObject,
  isString,
  isUint,
  SerializableObject,
} from 'isntnt'
import { Type } from 'jsonapi-client'

export const boolean: Type<boolean> = Type.is('a boolean', isBoolean)

export const string: Type<string> = Type.is('a string', isString)

export const number: Type<number> = Type.is('a number', isNumber)

export const uint: Type<number> = Type.is('an unsigned integer', isUint)

export const object: Type<SerializableObject> = Type.is(
  'a serializable object',
  isSerializableObject,
)
