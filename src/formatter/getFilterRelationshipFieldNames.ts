import { ResourceFieldName, ResourceFieldsFilterLimited } from '../types'
import { parseResourceFieldsQuery } from './parseResourceFieldsQuery'
import type { ResourceFormatter } from '../formatter'
import { ResourceFieldFlag } from '../data/enum'

// Get the combined ResourceFilter fieldNames for a collection of (relationship) resources
export const getFilterRelationshipFieldNames = (
  formatters: ReadonlyArray<ResourceFormatter>,
  fieldsFilter: ResourceFieldsFilterLimited<any>,
): ReadonlyArray<ResourceFieldName> =>
  // No need for de-duplication because a field being present is the optimum path
  formatters
    .flatMap((formatter) =>
      Object.hasOwnProperty.call(fieldsFilter, formatter.type)
        ? parseResourceFieldsQuery(formatter, (fieldsFilter as any)[formatter.type])
        : Object.keys(formatter.fields).filter(
            (fieldName) => !formatter.fields[fieldName].matches(ResourceFieldFlag.GetForbidden),
          ),
    )
    .filter((fieldName) =>
      formatters.some(
        (formatter) =>
          formatter.hasField(fieldName) && formatter.fields[fieldName].isRelationshipField(),
      ),
    )
