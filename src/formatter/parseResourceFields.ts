import type { ResourceFields } from '../types'
import { resourceFieldName, resourceField } from '../util/validators'

/** @hidden */
export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFieldsObject, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFieldsObject[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFieldsObject
  }, Object.create(null))
