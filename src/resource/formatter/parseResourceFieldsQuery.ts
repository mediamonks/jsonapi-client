import { ResourceFieldName } from '../../types'
import { isReadableField } from './isReadableField'
import type { ResourceFormatter } from '.'

/**
 * Return `fieldNames` if every fieldName is allowed in a ResourceFilter for `formatter`
 * @hidden
 * @param formatter A ResourceFormatter
 * @param fieldNames An Array of potential `formatter` field names
 * @throws An Error when some of the `fieldNames` are not valid for the `formatter`
 * @returns An Array of valid `formatter` field names, equals `fieldNames`
 */
export const parseResourceFieldsQuery = (
  formatter: ResourceFormatter,
  fieldNames: ReadonlyArray<string>,
): ReadonlyArray<ResourceFieldName> => {
  fieldNames.forEach((fieldName) => {
    if (!formatter.hasField(fieldName)) {
      throw new Error(`Field "${fieldName}" does not exist on resource of type "${formatter}"`)
    }
    if (!isReadableField(formatter.fields[fieldName])) {
      throw new Error(`Field "${fieldName}" may not be queried on resource of type "${formatter}"`)
    }
  })
  return fieldNames
}
