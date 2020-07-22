import { array, isObject, isString, optional, shape } from 'isntnt'
import { Type, StaticType } from 'jsonapi-client'

const isOdfStatsIndRankingStats = array(
  shape({
    code: isString,
    rank: isString,
    type: isString,
    value: isString,
    sortOrder: isString,
    rankEqual: isString, // 'Y' | 'N'
  }),
)

const isOdfStatsIndRanking = shape({
  stats: optional(isOdfStatsIndRankingStats),
})

const isCompetitorExtendedInfo = shape({
  odfExtensions: optional(isObject),
  odfPhotofinish: optional(isObject),
  odfMedallists: optional(isObject),
  odfRanking: optional(isObject),
  odfPlayByPlay: optional(isObject),
  odfStats: optional(isObject),
  odfStatsTournament: optional(isObject),
  odfStatsCumulative: optional(isObject),
  odfStatsTeamRanking: optional(isObject),
  odfStatsIndRanking: optional(isOdfStatsIndRanking),
  odfStatsRanking: optional(isObject),
  odfStatsAnalysis: optional(isObject),
  odfWeather: optional(isObject),
  odfEventEntry: optional(isObject),
})

export type CompetitorExtendedInfo = StaticType<typeof competitorExtendedInfo>

export const competitorExtendedInfo = Type.is(
  'a CompetitorExtendedInfo object',
  isCompetitorExtendedInfo,
)
