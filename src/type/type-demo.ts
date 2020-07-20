import { at, isString, min, test, isInt } from 'isntnt'

import Type from '.'

const int = Type.is('an int', isInt)

const string = Type.is('a string', isString)

string.assert(12) // TypeError { value must be a string }

const MIN_PASSWORD_LENGTH = 8

const minLengthPassword = Type.is(
  `a string with a length of at least ${MIN_PASSWORD_LENGTH}`,
  at('length', min(MIN_PASSWORD_LENGTH)),
).with({ code: 'password-too-short' })

const isStringWithNumericCharacter = test(/\d/)

const withNumericCharacterString = Type.is(
  'a string with a numeric character',
  isStringWithNumericCharacter,
)

const password = Type.and([string, minLengthPassword, withNumericCharacterString])

const user = Type.shape('a user', {
  name: string,
  emailAddress: string,
  password: password,
})

const x = Type.and([user])
const stringOrInt = Type.or([string, int])
