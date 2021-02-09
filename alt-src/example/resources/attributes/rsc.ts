import { Type } from '../../../index'

import { falseOrNull, string } from './primitive'

export type RSCValue = string | false | null

export const rscValue: Type<RSCValue> = Type.or([string, falseOrNull] as any)

export type RSCGender = 'M' | 'W' | false | null

export const rscGender: Type<RSCGender> = {} as any

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
