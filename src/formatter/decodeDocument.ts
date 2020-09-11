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

/** @hidden */
export const RESOURCE_DOCUMENT_CONTEXT: WeakMap<
  Resource<any, any> | Array<Resource<any, any>>,
  Pick<JSONAPIDocument, 'meta' | 'links'>
> = new WeakMap()

/** @hidden */
export const decodeDocument = <T extends ResourceFormatter, U extends ResourceFilter<T>>(
  formatters: Array<T>,
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

  parseResourceFilter(formatters, resourceFilter as any)

  const { fields = EMPTY_OBJECT as any, include = EMPTY_OBJECT } = resourceFilter
  const included = (document.included || []).concat(document.data)

  if ((isArray as Predicate<Array<any>>)(document.data)) {
    const resources: Array<Resource<T, U>> = []
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
      resources.push(value as any)
      validationErrors.forEach((error) => validationErrors.push(error))
    })
    if (validationErrors.length) {
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        validationErrors,
      )
    }
    if (document.meta || document.links) {
      RESOURCE_DOCUMENT_CONTEXT.set(resources, {
        meta: document.meta,
        links: document.links,
      })
    }
    return resources
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
    if (document.meta || document.links) {
      RESOURCE_DOCUMENT_CONTEXT.set(resource, {
        meta: document.meta,
        links: document.links,
      })
    }
    return resource as Resource<T, U>
  }
}
