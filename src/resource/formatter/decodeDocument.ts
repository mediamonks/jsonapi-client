import { OneResource, ManyResource } from '../../client/result'
import {
  ResourceValidationError,
  ClientResponseError,
  ResourceValidationErrorObject,
} from '../../error'
import { JSONAPIDocument, ResourceFilter } from '../../types'
import { jsonapiDocument } from '../../util/validators'
import { decodeResourceObject } from './decodeResourceObject'
import { parseResourceFilter } from './parseResourceFilter'
import type { ResourceFormatter } from '.'
import { EMPTY_OBJECT, EMPTY_ARRAY } from '../../util/constants'

export const decodeDocument = (
  formatters: ReadonlyArray<ResourceFormatter>,
  resourceDocument: JSONAPIDocument<any>,
  resourceFilter?: ResourceFilter<any>,
): OneResource<any> | ManyResource<any> => {
  if (!jsonapiDocument.predicate(resourceDocument)) {
    throw new ResourceValidationError(`Invalid JSONAPIDocument`, resourceDocument, [])
  }

  if ('errors' in resourceDocument) {
    throw new ClientResponseError(
      `JSONAPIDocument Has Errors`,
      resourceDocument,
      resourceDocument.errors!,
    )
  }

  if ('data' in resourceDocument) {
    parseResourceFilter(formatters, resourceFilter || EMPTY_OBJECT)

    const included = resourceDocument.included
      ? resourceDocument.included.concat(resourceDocument.data)
      : EMPTY_ARRAY

    if (Array.isArray(resourceDocument.data)) {
      const errors: Array<ResourceValidationErrorObject> = []
      const resources: Array<any> = []

      resourceDocument.data.forEach((resourceObject, index) => {
        const [resource, validationErrors] = decodeResourceObject(
          formatters,
          resourceObject,
          included,
          resourceFilter?.fields || EMPTY_OBJECT,
          resourceFilter?.include || EMPTY_OBJECT,
          [String(index)],
        )
        resources.push(resource)
        validationErrors.forEach((error) => errors.push(error))
      })
      if (errors.length) {
        throw new ResourceValidationError(`Validation Failed`, resources, errors)
      }
      return new ManyResource(resources as any, resourceDocument)
    } else {
      const [resource, validationErrors] = decodeResourceObject(
        formatters,
        resourceDocument.data,
        included,
        resourceFilter?.fields || ({} as any),
        resourceFilter?.include || {},
        [],
      )
      if (validationErrors.length) {
        throw new ResourceValidationError(`Validation Failed`, resource, validationErrors)
      }
      return new OneResource(resource as any, resourceDocument)
    }
  }

  throw new Error(`Unexpected Error`)
}
