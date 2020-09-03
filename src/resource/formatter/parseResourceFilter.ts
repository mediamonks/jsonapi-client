import { isArray, isString, isNull } from 'isntnt'

import { ResourceFieldFlag } from '../../enum'
import type { ResourceFieldsQuery, ResourceIncludeQuery, ResourceFilter } from '../../types'
import { EMPTY_OBJECT } from '../../util/constants'
import { resourceIdentifierKey } from '../../util/validators'
import { getCombinedFilterResourceFields } from './getCombinedResourceFields'
import type { ResourceFormatter } from '.'

/**
 * Parse a ResourceFilter against a ResourceFormatter[]
 * @hidden
 * @param formatters A ResourceFormatter[] to assert `fieldsFilter` and `includeFilter` with
 * @param resourceFilter A ResourceFilter object
 * @throws If an invalid `resourceFilter` is provided
 * @returns A ResourceFilter
 */
export const parseResourceFilter = (
  formatters: ReadonlyArray<ResourceFormatter>,
  resourceFilter: ResourceFilter<any> = {},
): ResourceFilter<any> => {
  // First, assert the includeFilter and gather all (included) formatters...
  const includedFormatters = assertIncludeFilterAndGetNestedFormatters(
    formatters,
    resourceFilter.fields || EMPTY_OBJECT,
    resourceFilter.include || EMPTY_OBJECT,
    [],
  )

  // ...then assert the fieldsFilter using each possible formatter included
  assertFieldsFilter(includedFormatters, resourceFilter.fields || EMPTY_OBJECT)

  return resourceFilter
}

export const assertFieldsFilter = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
) => {
  Object.keys(fieldsFilter).forEach((type) => {
    const formatter = formatters.find((formatter) => formatter.type === type)
    if (!formatter) {
      throw new TypeError(`Formatter for resource of type "${type}" not found`)
    }
    const formatterFilter = fieldsFilter[type]
    if (!isArray(formatterFilter)) {
      throw new TypeError(`Value in fields filter for resource of type "${type}" must be an Array`)
    }
    if (!formatterFilter.length) {
      throw new TypeError(`Value in fields filter for resource of type "${type}" must not be empty`)
    }
    formatterFilter.forEach((fieldName) => {
      if (!isString(fieldName)) {
        throw new TypeError(
          `Value in fields filter for resource of type "${type}" must be a string`,
        )
      }
      if (resourceIdentifierKey.predicate(fieldName)) {
        throw new TypeError(
          `Value in fields filter for resource of type "${type}" may not be "type" or "id"`,
        )
      }
      const field = formatter.fields[fieldName]
      if (!field) {
        throw new TypeError(
          `Field "${fieldName}" in fields filter for resource of type "${type}" does not exist`,
        )
      }
      if (field.matches(ResourceFieldFlag.NeverGet)) {
        throw new TypeError(
          `Field "${fieldName}" in fields filter for resource of type "${type}" must be omitted`,
        )
      }
    })
  })
}

export const assertIncludeFilterAndGetNestedFormatters = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery | null,
  pointer: ReadonlyArray<string>,
): ReadonlyArray<ResourceFormatter> => {
  if (isNull(includeFilter)) {
    return formatters
  }
  const combinedRelationshipFieldNames = getCombinedFilterResourceFields(
    formatters,
    fieldsFilter,
  ).filter((fieldName) =>
    formatters.some(
      (formatter) =>
        formatter.hasField(fieldName) &&
        formatter.fields[fieldName].isRelationshipField() &&
        !formatter.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
    ),
  )

  return formatters.concat(
    Object.keys(includeFilter).flatMap((fieldName) => {
      if (!combinedRelationshipFieldNames.includes(fieldName)) {
        throw new TypeError(
          `Field "${formatIncludePointer(
            pointer.concat(fieldName),
          )}" in ResourceIncludeQuery is not a relationship field on formatter of type ${formatFormatterTypes(
            formatters,
          )}`,
        )
      }

      const relatedFormatters = [
        ...new Set(
          formatters
            .filter((formatter) => formatter.hasField(fieldName))
            .flatMap((formatter) => formatter.fields[fieldName].getResources()),
        ),
      ]

      const childIncludeParam = includeFilter[fieldName]
      if (childIncludeParam !== null) {
        const childIncludeParam = includeFilter[fieldName]
        return assertIncludeFilterAndGetNestedFormatters(
          relatedFormatters,
          fieldsFilter,
          childIncludeParam as any,
          pointer.concat(fieldName),
        )
      }

      return relatedFormatters
    }),
  )
}

const formatFormatterTypes = (formatters: ReadonlyArray<ResourceFormatter>) =>
  formatters.map((formatter) => `"${formatter}"`).join(' | ')

const formatIncludePointer = (pointer: ReadonlyArray<string>) => pointer.join('.')
