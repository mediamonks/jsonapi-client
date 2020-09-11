import type { ErrorObjectPointer } from '../error'
import type { ResourceFormatter } from '../formatter'

/** @hidden */
export const formatFormatterTypes = (formatters: ReadonlyArray<ResourceFormatter>) =>
  formatters.map((formatter) => `"${formatter}"`).join(', ')

/** @hidden */
export const formatIncludePointer = (pointer: ReadonlyArray<string>) => pointer.join('.')

/** @hidden */
export const resourceTypeNotFoundDetail = (formatters: ReadonlyArray<ResourceFormatter>) =>
  formatters.length === 1
    ? `Resource type must equal "${formatters}"`
    : `Resource type must be one of; ${formatFormatterTypes(formatters)}`

/** @hidden */
export const onResourceOfTypeMessage = (
  formatters: ReadonlyArray<ResourceFormatter>,
  message: string,
) => `${message} on resource of type ${formatFormatterTypes(formatters)}`

/** @hidden */
export const invalidFieldsFilterMessage = (formatter: ResourceFormatter, message: string) =>
  onResourceOfTypeMessage([formatter], `Fields filter ${message}`)

export const invalidIncludeFilterMessage = (
  formatters: ReadonlyArray<ResourceFormatter>,
  pointer: ErrorObjectPointer,
  message: string,
) =>
  onResourceOfTypeMessage(
    formatters,
    `Field "${formatIncludePointer(pointer)}" in include filter ${message}`,
  )
