import { isAny, isString, isUint, record, array } from 'isntnt'
import { Type } from 'jsonapi-client'

import { string, boolean, uint } from './primitive'

// Analytics Configuration
type AnalyticsConfiguration = {
  accountId?: string
}

const analyticsConfiguration: Type<AnalyticsConfiguration> = Type.shape(
  'an AnalyticsConfiguration object',
  {
    accountId: Type.optional(string),
  },
)

// Competition Configuration
type CompetitionConfigurationTimeZone = {
  name: string
}

const competitionConfigurationTimeZone = Type.shape('a CompetitionConfigurationTimeZone object', {
  name: string,
})

type CompetitionConfigurationDay = {
  day: string
  date: string
}

const competitionConfigurationDay = Type.shape('a CompetitionConfigurationDay object', {
  day: string,
  date: string,
})

type CompetitionConfigurationDefaultDayTimes = {
  start: string
  end: string
}

const competitionConfigurationDefaultDayTimes = Type.shape(
  'a CompetitionConfigurationDefaultDayTimes object',
  {
    start: string,
    end: string,
  },
)

type CompetitionConfiguration = {
  timezone: CompetitionConfigurationTimeZone
  days: Array<CompetitionConfigurationDay>
  usePhasesFor?: Array<string>
  defaultCompetitionDayTimes?: CompetitionConfigurationDefaultDayTimes
}

const competitionConfiguration: Type<CompetitionConfiguration> = Type.shape(
  'a CompetitionConfiguration object',
  {
    timezone: competitionConfigurationTimeZone,
    days: Type.array(competitionConfigurationDay),
    usePhasesFor: Type.optional(Type.array(string)),
    defaultCompetitionDayTimes: Type.optional(competitionConfigurationDefaultDayTimes),
  },
)

// OutLinks Configuration
type OutLinksConfiguration = {
  overrides?: string
}

const outLinksConfiguration: Type<OutLinksConfiguration> = Type.shape(
  'an OutLinksConfiguration object',
  {
    overrides: Type.optional(string),
  },
)

// RHB Configuration
enum RHBMedalConfigurationSortMethod {
  Total = 'total',
  Gold = 'gold',
  Alphabetical = 'alphabetical',
}

const rhbMedalConfigurationSortMethod = Type.either(
  ...Object.values(RHBMedalConfigurationSortMethod),
)

type RHBMedalConfiguration = {
  defaultSortMethod?: RHBMedalConfigurationSortMethod
  sortMethods?: Array<RHBMedalConfigurationSortMethod>
}

const rhbMedalConfiguration = Type.shape('a RHBMedalConfiguration object', {
  defaultSortMethod: Type.optional(rhbMedalConfigurationSortMethod),
  sortMethods: Type.optional(Type.array(rhbMedalConfigurationSortMethod)),
})

type RHBConfigurationLogo = {
  desktop: string
  mobile: string
}

const rhbConfigurationLogo = Type.shape('a RHBConfigurationLogo object', {
  desktop: string,
  mobile: string,
})

type RHBConfiguration = {
  medals?: RHBMedalConfiguration
  featuredOrganisationCode?: string
  displayAdsEnabled?: boolean
  stickyEnabled?: boolean
  stickyOffset?: number
  rhbName?: string
  videoLogo?: string
  navLogo?: RHBConfigurationLogo
  secondaryLogo?: RHBConfigurationLogo
  footerLogo?: string
}

const rhbConfiguration: Type<RHBConfiguration> = Type.shape('an RHBConfiguration object', {
  medals: Type.optional(rhbMedalConfiguration),
  featuredOrganisationCode: Type.optional(string),
  displayAdsEnabled: Type.optional(boolean),
  stickyEnabled: Type.optional(boolean),
  stickyOffset: Type.optional(uint),
  rhbName: Type.optional(string),
  videoLogo: Type.optional(string),
  navLogo: Type.optional(rhbConfigurationLogo),
  secondaryLogo: Type.optional(rhbConfigurationLogo),
  footerLogo: Type.optional(string),
})

// Theme Configuration
type ThemeConfigurationColors = any
type ThemeConfigurationGroups = any

type ThemeConfiguration = {
  inverted?: boolean
  font?: string
  colors?: ThemeConfigurationColors
  groups?: ThemeConfigurationGroups
}

const themeConfiguration: Type<ThemeConfiguration> = Type.shape('a ThemeConfiguration object', {
  inverted: Type.optional(boolean),
  font: Type.optional(string),
  colors: Type.optional(Type.is('any', isAny)),
  groups: Type.optional(Type.is('any', isAny)),
})

// User Configuration
type UserConfigurationFavouriteCount = Record<string, number>

const userConfigurationFavouriteCount = Type.is(
  'a UserConfigurationFavouriteCount object',
  record(isString, isUint),
)

type UserConfiguration = {
  maxFavouriteCount?: Record<string, number>
}

const userConfiguration: Type<UserConfiguration> = Type.shape('a UserConfiguration object', {
  maxFavouriteCount: Type.optional(userConfigurationFavouriteCount),
})

// Video Ads Configuration
enum VideoAdsConfigurationVideoType {
  Live = 'live',
  FullEventReplay = 'fer',
  VideoOnDemand = 'vod',
}

const videoAdsConfigurationVideoType = Type.either(...Object.values(VideoAdsConfigurationVideoType))

enum VideoAdsConfigurationAdType {
  PreRoll = 'preroll',
  MidRoll = 'midroll',
  PostRoll = 'postroll',
}

const videoAdsConfigurationAdType = Type.either(...Object.values(VideoAdsConfigurationAdType))

enum VideoAdsConfigurationUserType {
  Anonymous = 'anonymous',
  Freemium = 'freemium',
  Premium = 'premium',
}

const videoAdsConfigurationUserType = Type.either(...Object.values(VideoAdsConfigurationUserType))

// Video Ads Configuration Sources
type VideoAdsConfigurationAdTypeSources = Record<VideoAdsConfigurationAdType, string>

const videoAdsConfigurationAdTypeSources = Type.is(
  'a VideoAdsConfigurationAdTypeSources record',
  record(videoAdsConfigurationAdType.predicate, isString),
)

type VideoAdsConfigurationSources = Record<
  VideoAdsConfigurationVideoType,
  VideoAdsConfigurationAdTypeSources
>

const videoAdsConfigurationSources: Type<VideoAdsConfigurationSources> = Type.is(
  'a VideoAdsConfigurationSources record',
  record(videoAdsConfigurationVideoType.predicate, videoAdsConfigurationAdTypeSources.predicate),
)

// Video Ads Configuration Rules
type VideoAdsConfigurationVideoTypeRules = Record<
  VideoAdsConfigurationUserType,
  Array<VideoAdsConfigurationAdType>
>

const videoAdsConfigurationVideoTypeRules = Type.is(
  'a VideoAdsConfigurationVideoTypeRules record',
  record(videoAdsConfigurationUserType.predicate, array(videoAdsConfigurationAdType.predicate)),
)

type VideoAdsConfigurationRules = Record<
  VideoAdsConfigurationVideoType,
  VideoAdsConfigurationVideoTypeRules
>

const videoAdsConfigurationRules = Type.is(
  'a VideoAdsConfigurationRules record',
  record(videoAdsConfigurationVideoType.predicate, videoAdsConfigurationVideoTypeRules.predicate),
)

type VideoAdsConfiguration = {
  skipOffset?: string | null
  useGoogleIMA?: boolean
  sources?: VideoAdsConfigurationSources
  rules?: VideoAdsConfigurationRules
}

const videoAdsConfiguration: Type<VideoAdsConfiguration> = Type.shape(
  'a VideoAdsConfiguration object',
  {
    skipOffset: Type.maybe(string),
    useGoogleIMA: Type.optional(boolean),
    sources: Type.optional(videoAdsConfigurationSources),
    rules: Type.optional(videoAdsConfigurationRules),
  },
)

// ConfigurationValue
export type ConfigurationValue =
  | AnalyticsConfiguration
  | CompetitionConfiguration
  | OutLinksConfiguration
  | RHBConfiguration
  | ThemeConfiguration
  | UserConfiguration
  | VideoAdsConfiguration

export const configurationValue: Type<ConfigurationValue> = Type.or([
  analyticsConfiguration,
  competitionConfiguration,
  outLinksConfiguration,
  rhbConfiguration,
  themeConfiguration,
  userConfiguration,
  videoAdsConfiguration,
])
