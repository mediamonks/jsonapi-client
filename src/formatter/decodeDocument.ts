import { isArray } from 'isntnt'
import { ValidationErrorMessage } from '../data/enum'
import {
  ResourceDocumentError,
  ResourceValidationErrorObject,
  ResourceValidationError,
} from '../error'
import { JSONAPIDocument, Resource, ResourceFilterLimited } from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { decodeResourceObject } from './decodeResourceObject'
import type { ResourceFormatter } from '../formatter'
import { jsonapiDocument } from '../util/validators'

/** @hidden */
export const decodeDocument = <T extends ResourceFormatter, U extends ResourceFilterLimited<T>>(
  formatters: ReadonlyArray<T>,
  document: JSONAPIDocument<T>,
  filter: U = EMPTY_OBJECT as U,
): Resource<T, U> | ReadonlyArray<Resource<T, U>> => {
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

  const included = (document.included || []).concat(document.data) as Array<any>

  if (isArray(document.data)) {
    const data: Array<Resource<T, U>> = []
    const errors: Array<ResourceValidationErrorObject> = []

    document.data.forEach((resource) => {
      const [value, resourceErrors] = decodeResourceObject(
        formatters,
        resource,
        included,
        filter.fields || (EMPTY_OBJECT as any),
        filter.include || (EMPTY_OBJECT as any),
        [],
      )
      data.push(value as any)
      resourceErrors.forEach((error) => errors.push(error))
    })

    if (errors.length) {
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        errors,
      )
    }

    return data
  } else {
    const [resource, errors] = decodeResourceObject(
      formatters,
      document.data,
      included,
      filter.fields || (EMPTY_OBJECT as any),
      filter.include || (EMPTY_OBJECT as any),
      [],
    )

    if (errors.length) {
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        errors,
      )
    }

    return resource as any
  }
}
