import { Type } from 'jsonapi-client'
import { uint } from './primitive'

export type MedalStatistics = {
  total: number
  gold: number
  silver: number
  bronze: number
}

export const medalStatistics: Type<MedalStatistics> = Type.shape('a MedalStatistics object', {
  total: uint,
  gold: uint,
  silver: uint,
  bronze: uint,
})
