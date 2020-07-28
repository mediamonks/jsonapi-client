import { Type } from '../../../../../src'

export enum ConfigurationKey {
  CompetitionConfiguration = 'competition-configuration',
  OutLinks = 'outlinks',
  Theme = 'theme',
  RHBConfiguration = 'rhb-configuration',
  VideoAds = 'video-ads',
  Analytics = 'analytics',
  UserConfiguration = 'user-configuration',
}

export const configurationKey: Type<ConfigurationKey> = Type.either(
  ...Object.values(ConfigurationKey),
)
