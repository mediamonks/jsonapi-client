import { isArray, Predicate } from 'isntnt'

import { ValidationErrorMessage } from '../data/enum'
import {
  ResourceDocumentError,
  ResourceValidationErrorObject,
  ResourceValidationError,
} from '../error'
import { JSONAPIDocument, ResourceFilter, Resource } from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { decodeResourceObject } from './decodeResourceObject'
import { parseResourceFilter } from './parseResourceFilter'
import type { ResourceFormatter } from '../formatter'
import { jsonapiDocument } from '../util/validators'
import { createContextStore } from '../util/createContextStore'

/** @hidden */
export const DOCUMENT_CONTEXT_STORE = createContextStore()

/** @hidden */
export const decodeDocument = <T extends ResourceFormatter, U extends ResourceFilter<T>>(
  formatters: ReadonlyArray<T>,
  document: JSONAPIDocument<T>,
  resourceFilter: U = EMPTY_OBJECT as U,
): Resource<T, U> | Array<Resource<T, U>> => {
  if (!jsonapiDocument.predicate(document)) {
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourceDocument, document, [])
  }

  if ('errors' in document) {
    throw new ResourceDocumentError(
      ValidationErrorMessage.JSONAPIDocumentWithErrors,
      document,
      document.errors!,
    )
  }

  const included = (document.included || []).concat(document.data)
  const { fields = EMPTY_OBJECT, include = EMPTY_OBJECT } = parseResourceFilter(
    formatters,
    resourceFilter as any,
  )

  if ((isArray as Predicate<Array<any>>)(document.data)) {
    const data: Array<Resource<T, U>> = []
    const validationErrors: Array<ResourceValidationErrorObject> = []

    document.data.forEach((resource) => {
      const [value, validationErrors] = decodeResourceObject(
        formatters,
        resource,
        included,
        fields,
        include,
        [],
      )
      data.push(value as any)
      validationErrors.forEach((error) => validationErrors.push(error))
    })

    if (validationErrors.length) {
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        validationErrors,
      )
    }

    DOCUMENT_CONTEXT_STORE.set(data, document)
    return data
  } else {
    const [resource, validationErrors] = decodeResourceObject(
      formatters,
      document.data,
      included,
      fields,
      include,
      [],
    )

    if (validationErrors.length) {
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        validationErrors,
      )
    }

    DOCUMENT_CONTEXT_STORE.set(resource, document)
    return resource as any
  }
}
