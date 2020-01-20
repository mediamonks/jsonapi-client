import { array, either, isAny, isBoolean, isNumber, isString, or, shape, Static } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

type SpecificConfiguration<K extends keyof typeof KEY, V extends typeof isConfigValue> = Omit<
  Configuration,
  'key' | 'value'
> & {
  key: typeof KEY[K]
  value: Static<V>
}

const KEY = {
  CompetitionConfiguration: 'competition-configuration',
  Outlinks: 'outlinks',
  Theme: 'theme',
  RHBConfiguration: 'rhb-configuration',
} as const

// competition-configuration
const isTimezone = shape({ name: isString })
const isDays = array(shape({ day: isNumber, date: isString }))

const isCompetitionConfiguration = shape({
  timezone: isTimezone,
  days: isDays,
})

// outlinks
// const isLink = isAny;

const isOutlinks = shape({
  // using links currently causes an error on Configuration class due to { relationships; links } check
  // links: array(isLink),
})

// rhb-configuration
const isMedals = shape({ population: isBoolean, rankingField: either('total', 'gold') })

const isRHBConfiguration = shape({
  medals: isMedals,
})

// theme
const isColor = isAny
const isGroup = isAny

const isTheme = shape({
  inverted: isBoolean,
  font: isString,
  colors: isColor,
  groups: isGroup,
})

const isConfigValue = or(isCompetitionConfiguration, isOutlinks, isRHBConfiguration, isTheme)

export type CompetitionConfiguration = SpecificConfiguration<
  'CompetitionConfiguration',
  typeof isCompetitionConfiguration
>
export type ThemeConfiguration = SpecificConfiguration<'Theme', typeof isTheme>
export type RHBConfiguration = SpecificConfiguration<'RHBConfiguration', typeof isRHBConfiguration>
export type OutlinksConfiguration = SpecificConfiguration<'Outlinks', typeof isOutlinks>

export class Configuration extends JSONAPI.resource('Configuration')<Configuration> {
  @Attribute.required(isString) public key!: string
  @Attribute.required(isAny) public value!: any

  public static isCompetitionConfiguration(
    config: Configuration,
  ): config is CompetitionConfiguration {
    return config.key === KEY.CompetitionConfiguration && isCompetitionConfiguration(config.value)
  }

  public static isOutlinks(config: Configuration): config is OutlinksConfiguration {
    return config.key === KEY.Outlinks && isOutlinks(config.value)
  }

  public static isRHBConfiguration(config: Configuration): config is RHBConfiguration {
    return config.key === KEY.RHBConfiguration && isRHBConfiguration(config.value)
  }

  public static isTheme(config: Configuration): config is ThemeConfiguration {
    return config.key === KEY.Theme && isTheme(config.value)
  }
}
