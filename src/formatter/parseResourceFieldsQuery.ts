import { ResourceFieldFlag } from '../data/enum'
import { ResourceFieldName } from '../types'
import type { ResourceFormatter } from '../formatter'

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
      throw new TypeError(`Field "${fieldName}" does not exist on resource of type "${formatter}"`)
    }
    if (formatter.getField(fieldName).matches(ResourceFieldFlag.GetForbidden)) {
      throw new TypeError(
        `Field "${fieldName}" may not be queried on resource of type "${formatter}"`,
      )
    }
  })
  return fieldNames
}
