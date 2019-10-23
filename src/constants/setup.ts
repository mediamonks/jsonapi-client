import { ValuesOf } from '../types/util'

export const defaultIncludeFieldOptions = {
  NONE: 'none',
  PRIMARY: 'primary',
} as const

export type defaultIncludeFieldOptions = ValuesOf<
  typeof defaultIncludeFieldOptions
>

export type DefaultIncludeFieldsOptions = typeof defaultIncludeFieldOptions

export type DefaultIncludeFieldsOption = ValuesOf<DefaultIncludeFieldsOptions>
