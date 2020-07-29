import { ResourceFieldsQuery, ResourceFieldName } from '../../types'
import { isReadableField } from './isReadableField'
import type { ResourceFormatter } from '.'

/**
 * Get the combined (filtered) fieldNames from one or more ResourceFormatters.
 * @param formatters An Array where every element is a ResourceFormatter to which `fieldsFilter` may apply to.
 * @param fieldsFilter A ResourceFieldsQuery object that contains potential (filtered) resource fieldNames.
 * @returns A de-duplicated Array of (filtered) fieldNames present in its provided `formatters`.
 */
export const getFilteredFieldNames = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsQuery,
): ReadonlyArray<ResourceFieldName> => {
  return [
    // TODO: De-duplication may be optimized
    ...new Set(
      formatters.flatMap(
        (formatter) =>
          // If ResourceFormatter#type is present in the ResourceFieldsQuery, use those fieldNames...
          fieldsFilter[formatter.type] ||
          // ...otherwise use all 'gettable' fieldNames from the ResourceFormatter
          Object.keys(formatter.fields).filter((fieldName) =>
            isReadableField(formatter.fields[fieldName]),
          ),
      ),
    ),
  ]
}
