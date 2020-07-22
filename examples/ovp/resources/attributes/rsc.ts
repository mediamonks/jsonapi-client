import { Type } from 'jsonapi-client'

import { falseOrNull, string } from './primitive'

export type RSCValue = string | false | null

export const rscValue: Type<RSCValue> = Type.or([string, falseOrNull])

export type RSCGender = 'M' | 'V' | false | null

export const rscGender: Type<RSCGender> = Type.either('M', 'V', false, null)

export type RSC = {
  final: RSCValue
  discipline: RSCValue
  gender: RSCGender
}

export const rsc: Type<RSC> = Type.shape('an RSC object', {
  final: rscValue,
  discipline: rscValue,
  gender: rscGender,
})
