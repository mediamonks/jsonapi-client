import { isArray } from 'isntnt'

import { ValidationErrorMessage, ErrorMessage } from '../../enum'
import {
  ResourceDocumentError,
  ResourceValidationErrorObject,
  ResourceValidationError,
} from '../../error'
import {
  JSONAPIDocument,
  ResourceFilter,
  FilteredResource,
  JSONAPIResourceObject,
} from '../../types'
import { EMPTY_OBJECT, EMPTY_ARRAY } from '../../util/constants'
import { decodeResourceObject } from './decodeResourceObject'
import { parseResourceFilter } from './parseResourceFilter'
import type { ResourceFormatter } from '.'
import { jsonapiDocument } from '../../util/validators'

export const decodeDocument = (
  formatters: ReadonlyArray<ResourceFormatter>,
  document: JSONAPIDocument,
  resourceFilter?: ResourceFilter<any>,
): FilteredResource | Array<FilteredResource> => {
  if (!jsonapiDocument.predicate(document)) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourceDocument, document, [])
  }

  if ('errors' in document) {
    throw new ResourceDocumentError(
      ValidationErrorMessage.JSONAPIDocumentWithErrors,
      document,
      document.errors,
    )
  }

  if ('data' in document) {
    parseResourceFilter(formatters, resourceFilter || EMPTY_OBJECT)

    const included = (document.included || []).concat(document.data)
    if (isArray(document.data)) {
      const resources: Array<FilteredResource> = []
      const validationErrors: Array<ResourceValidationErrorObject> = []

      document.data.forEach((resource) => {
        const [value, validationErrors] = decodeResourceObject(
          formatters,
          resource as JSONAPIResourceObject,
          included,
          resourceFilter?.fields || EMPTY_OBJECT,
          resourceFilter?.include || EMPTY_OBJECT,
          EMPTY_ARRAY,
        )
        resources.push(value)
        validationErrors.forEach((error) => validationErrors.push(error))
      })
      if (validationErrors.length) {
        throw new ResourceValidationError(
          ValidationErrorMessage.InvalidResourceDocument,
          document,
          validationErrors,
        )
      }
      return resources
    } else {
      const [resource, validationErrors] = decodeResourceObject(
        formatters,
        document.data,
        included,
        resourceFilter?.fields || EMPTY_OBJECT,
        resourceFilter?.include || EMPTY_OBJECT,
        [],
      )
      if (validationErrors.length) {
        throw new ResourceValidationError(
          ValidationErrorMessage.InvalidResourceDocument,
          document,
          validationErrors,
        )
      }
      return resource
    }
  }

  throw new ResourceDocumentError(ErrorMessage.UnexpectedError, document, [])
}
