import { isReadableField } from './isReadableField'
import type { ResourceFormatter } from '.'

// Only return fieldNames if every fieldName may be present in a ResourceFilter for resource
export const parseResourceFieldsQuery = (
  resource: ResourceFormatter,
  fieldNames: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  fieldNames.forEach((fieldName) => {
    if (!resource.hasField(fieldName)) {
      throw new Error(`Field ${fieldName} does not exist`)
    }
    if (!isReadableField(resource.fields[fieldName])) {
      throw new Error(`Field ${fieldName} is not permitted to be used in a fields filter`)
    }
  })
  return fieldNames
}
