import { isArray } from 'isntnt'

import { ResourceFieldsQuery, ResourceIncludeQuery } from '../../types'
import { getCombinedFilterResourceFields } from './getCombinedResourceFields'
import { isReadableField } from './isReadableField'
import type { ResourceFormatter } from '.'

export const assertResourceFilter = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
) => {
  const includedFormatters = assertIncludeFilterAndGetNestedFormatters(
    formatters,
    fieldsFilter,
    includeFilter,
    pointer,
  )

  assertFieldsFilter(includedFormatters, fieldsFilter)
}

export const assertFieldsFilter = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
) => {
  Object.keys(fieldsFilter).forEach((type) => {
    const formatter = formatters.find((formatter) => formatter.type === type)
    if (!formatter) {
      throw new Error(`formatter not found`)
    }
    const formatterFilter = fieldsFilter[type]
    if (!isArray(formatterFilter)) {
      throw new TypeError(`filter must be array`)
    }
    if (!formatterFilter.length) {
      throw new TypeError(`filter must not be empty`)
    }
    // TODO: validate formatterFilter fieldNames
  })
}

export const assertIncludeFilterAndGetNestedFormatters = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
  includeFilter: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
): Array<ResourceFormatter> => {
  const combinedRelationshipFieldNames = getCombinedFilterResourceFields(
    formatters,
    fieldsFilter,
  ).filter((fieldName) =>
    formatters.some(
      (formatter) =>
        formatter.fields[fieldName].isRelationshipField() &&
        isReadableField(formatter.fields[fieldName]),
    ),
  )

  return formatters.concat(
    Object.keys(includeFilter).flatMap((fieldName) => {
      if (!combinedRelationshipFieldNames.includes(fieldName)) {
        throw new Error(
          `Included field "${pointer
            .concat(fieldName)
            .join(
              '.',
            )}" cannot be included because it is not a formatter field name (${formatters})`,
        )
      }

      const formattersWithField = formatters.filter((formatter) => formatter.hasField(fieldName))
      if (!formattersWithField.length) {
        throw new Error(
          `Included field "${fieldName}" does not exists on formatter (${formatters})`,
        )
      }

      const formattersWithRelationshipField = formattersWithField.filter((formatter) =>
        formatter.getField(fieldName).isRelationshipField(),
      )
      if (!formattersWithRelationshipField.length) {
        throw new Error(`Included field "${fieldName}" is not a relationship field`)
      }

      const relatedFormatters = [
        ...new Set(
          formattersWithRelationshipField.flatMap((resource) =>
            resource.getField(fieldName).getResources(),
          ),
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
