import { isArray, isString, isNull, isPlainObject } from 'isntnt'

import { ResourceFieldFlag } from '../data/enum'
import type { ResourceFieldsQuery, ResourceIncludeQuery, ResourceFilter } from '../types'
import { EMPTY_OBJECT, EMPTY_ARRAY } from '../data/constants'
import {
  invalidFieldsFilterMessage,
  invalidIncludeFilterMessage,
  onResourceOfTypeMessage,
} from '../util/formatting'
import { resourceIdentifierKey } from '../util/validators'
import { getFilterRelationshipFieldNames } from './getFilterRelationshipFieldNames'
import type { ResourceFormatter } from '../formatter'

/**
 * Parse a ResourceFilter against a ResourceFormatter[]
 * @hidden
 * @param formatters A ResourceFormatter[] to assert `fieldsFilter` and `includeFilter` with
 * @param resourceFilter A ResourceFilter object
 * @throws If an invalid `resourceFilter` is provided
 * @returns A ResourceFilter
 */
export const parseResourceFilter = <T extends ResourceFilter>(
  formatters: ReadonlyArray<ResourceFormatter>,
  resourceFilter: T,
): T => {
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
      throw new TypeError(onResourceOfTypeMessage(formatters, `Formatter not found`))
    }
    const formatterFilter = fieldsFilter[type]
    if (!isArray(formatterFilter)) {
      throw new TypeError(invalidFieldsFilterMessage(formatter, `must be an Array`))
    }
    if (!formatterFilter.length) {
      throw new TypeError(invalidFieldsFilterMessage(formatter, `may not be empty`))
    }
    formatterFilter.forEach((fieldName) => {
      if (!isString(fieldName)) {
        throw new TypeError(invalidFieldsFilterMessage(formatter, `must be a string`))
      }
      if (resourceIdentifierKey.predicate(fieldName)) {
        throw new TypeError(invalidFieldsFilterMessage(formatter, `may not equal "type" or "id"`))
      }
      const field = formatter.fields[fieldName]
      if (!field) {
        throw new TypeError(
          invalidFieldsFilterMessage(formatter, `can not include "${fieldName}" field`),
        )
      }
      if (field.matches(ResourceFieldFlag.GetForbidden)) {
        throw new TypeError(
          invalidFieldsFilterMessage(formatter, `may not include "${fieldName}" field`),
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
  if (!isPlainObject(includeFilter)) {
    throw new Error(invalidIncludeFilterMessage(formatters, pointer, 'must be an object or null'))
  }
  const combinedRelationshipFieldNames = getFilterRelationshipFieldNames(formatters, fieldsFilter)

  // de-duplication not required because an include filter has a finite depth
  return formatters.concat(
    Object.keys(includeFilter).flatMap((fieldName) => {
      if (!combinedRelationshipFieldNames.includes(fieldName)) {
        throw new TypeError(
          invalidIncludeFilterMessage(
            formatters,
            pointer.concat(fieldName),
            'is not a relationship',
          ),
        )
      }

      const relatedFormatters: ReadonlyArray<ResourceFormatter> = formatters.flatMap((formatter) =>
        formatter.hasField(fieldName) && formatter.fields[fieldName].isRelationshipField()
          ? formatter.fields[fieldName].getFormatters()
          : EMPTY_ARRAY,
      )

      const childIncludeParam = Object.hasOwnProperty.call(includeFilter, fieldName)
        ? includeFilter[fieldName as keyof typeof includeFilter]!
        : null

      return assertIncludeFilterAndGetNestedFormatters(
        relatedFormatters,
        fieldsFilter,
        childIncludeParam,
        pointer.concat(fieldName),
      )
    }),
  )
}
