import { ResourceField, ResourceFieldFlag } from '../field'

// A field with a NeverGet flag may not be included in a ResourceFilter
export const isReadableField = (field: ResourceField) => !field.matches(ResourceFieldFlag.NeverGet)
