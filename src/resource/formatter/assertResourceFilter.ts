import { ResourceFieldsQuery, ResourceIncludeQuery } from '../../types'
import { getCombinedFilterResourceFields } from './getCombinedResourceFields'
import { isReadableField } from './isReadableField'
import type { ResourceFormatter } from '.'

export const assertResourceFilter = (
  formatters: ReadonlyArray<ResourceFormatter>,
  resourceFieldsQuery: ResourceFieldsQuery,
  includeQuery: ResourceIncludeQuery,
  pointer: ReadonlyArray<string>,
) => {
  const presentRelationshipFieldNames = getCombinedFilterResourceFields(
    formatters,
    resourceFieldsQuery,
  ).filter((fieldName) =>
    formatters.some(
      (formatter) =>
        formatter.fields[fieldName].isRelationshipField() &&
        isReadableField(formatter.fields[fieldName]),
    ),
  )

  Object.keys(includeQuery).forEach((fieldName) => {
    if (!presentRelationshipFieldNames.includes(fieldName)) {
      throw new Error(
        `Field "${pointer
          .concat([fieldName])
          .join('.')}" cannot be included because it is not present in the fields filter`,
      )
    }

    const formattersWithField = formatters.filter((formatter) => formatter.hasField(fieldName))
    if (!formattersWithField.length) {
      throw new Error(`Field "${fieldName}" does not exists`)
    }

    const formattersWithRelationshipField = formattersWithField.filter((formatter) =>
      formatter.getField(fieldName).isRelationshipField(),
    )
    if (!formattersWithRelationshipField.length) {
      throw new Error(`Field "${fieldName}" is not a relationship field`)
    }

    const childIncludeParam = includeQuery[fieldName]
    if (childIncludeParam !== null) {
      const relatedFormatters = [
        ...new Set(
          formattersWithRelationshipField.flatMap((resource) =>
            resource.getField(fieldName).getResources(),
          ),
        ),
      ]

      assertResourceFilter(
        relatedFormatters,
        resourceFieldsQuery,
        childIncludeParam as any,
        pointer.concat([fieldName]),
      )
    }
  })
  return
}
