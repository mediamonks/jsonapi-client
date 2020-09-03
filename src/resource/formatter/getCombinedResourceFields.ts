import { ResourceFieldsQuery } from '../../types'
import { parseResourceFieldsQuery } from './parseResourceFieldsQuery'
import type { ResourceFormatter } from '.'
import { ResourceFieldFlag } from '../../enum'

// Get the combined ResourceFilter fieldNames for a collection of (relationship) resources
export const getCombinedFilterResourceFields = (
  resources: ReadonlyArray<ResourceFormatter>,
  fields: ResourceFieldsQuery,
): ReadonlyArray<string> =>
  // No need for de-duplication because a field being present is the optimum path
  resources.flatMap((resource) =>
    resource.type in fields
      ? parseResourceFieldsQuery(resource, (fields as any)[resource.type])
      : Object.keys(resource.fields).filter(
          (fieldName) => !resource.fields[fieldName].matches(ResourceFieldFlag.NeverGet),
        ),
  )
