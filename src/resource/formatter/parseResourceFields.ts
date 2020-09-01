// TODO: Refactor because not actually a formatter

import type { ResourceFields } from '../../types'
import { resourceFieldName, resourceField } from '../../util/validators'

/** @hidden */
export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFields, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFields[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFields
  }, Object.create(null))
