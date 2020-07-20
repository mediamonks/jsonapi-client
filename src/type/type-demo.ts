import { at, isString, min, test, isInt } from 'isntnt'

import Type from '.'

const int = Type.is('an int', isInt)

const string = Type.is('a string', isString)

const name = string.assert(12)
/* 
TypeValidationError { 
  message: string, 
  actual: 12, 
  details: [TypeValidationErrorDetails {
    code: null,
    title: string
    pointer: [],
  }]  
}
*/

const MIN_PASSWORD_LENGTH = 8

const minLengthPassword = Type.has(
  `a length of at least ${MIN_PASSWORD_LENGTH}`,
  at('length', min(MIN_PASSWORD_LENGTH)),
).with({ code: 'password-too-short' })

const withNumericCharacterString = Type.includes('a numeric character', test(/\d/)).with({
  code: 'missing-numeric-character',
})

const password = string.with({
  code: 'invalid-password',
  rules: [minLengthPassword as Type<string>, withNumericCharacterString],
})

const emailAddress = string.with({
  code: 'invalid-email-address',
  rules: [],
})

const oi = Type.shape({
  name: string,
  password: password,
})

const user = Type.shape({ name: string })

const x = Type.and([user])
const stringOrInt = Type.or([string, int])
