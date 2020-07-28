import { Type } from '../../../../../src'

import { falseOrNull, string } from './primitive'

export type RSCValue = string | false | null

export const rscValue: Type<RSCValue> = Type.or([string, falseOrNull])

export type RSCGender = 'M' | 'W' | false | null

export const rscGender: Type<RSCGender> = Type.either('M', 'W', false, null)

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
