import { at, isString, min, test, isInt, isObject } from 'isntnt'

import T from './type'

const int = T.is('an int', isInt)

const string = T.is('a string', isString)

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

const minLengthPassword = T.has(
  `a length of at least ${MIN_PASSWORD_LENGTH}`,
  at('length', min(MIN_PASSWORD_LENGTH)),
).with({ code: 'password-too-short' })

const withNumericCharacterString = T.includes('a numeric character', test(/\d/)).with({
  code: 'missing-numeric-character',
})

const password = string.with({
  code: 'invalid-password',
  rules: [minLengthPassword as T<string>, withNumericCharacterString],
})

const emailAddress = string.with({
  code: 'invalid-email-address',
  rules: [],
})

const oi = T.shape({
  name: string,
  password: password,
})

const user = T.shape({ name: string })

const x = T.and([user])
const stringOrInt = T.or([string, int])
