import { Type } from '../../../../../src'

import { MedalStatistics } from './medalStatistics'
import { uint } from './primitive'

export type MedalRankStatistics = MedalStatistics & {
  goldRank: number
  totalRank: number
  previousGoldRank?: number
  previousTotalRank?: number
}

export const medalRankStatistics: Type<MedalRankStatistics> = Type.shape(
  'a MedalRankStatistics object',
  {
    total: uint,
    gold: uint,
    silver: uint,
    bronze: uint,
    goldRank: uint,
    totalRank: uint,
    previousGoldRank: Type.optional(uint),
    previousTotalRank: Type.optional(uint),
  },
)
