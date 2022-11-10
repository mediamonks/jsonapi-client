import { isArray } from 'isntnt'
import { ValidationErrorMessage } from '../data/enum'
import {
  ResourceDocumentError,
  ResourceValidationErrorObject,
  ResourceValidationError,
} from '../error'
import type { Resource, ResourceFilterLimited, NaiveResource, WithMeta } from '../types'
import type { ResourceId, ResourceType, ResourceDocument, ErrorObject } from '../types/jsonapi'
import { EMPTY_OBJECT, LINKS_ACCESSOR, META_ACCESSOR, __DEV__ } from '../data/constants'
import { decodeResourceObject } from './decodeResourceObject'
import type { ResourceFormatter } from '../formatter'
import { jsonapiDocument } from '../util/validators'

export type BaseIncludedResourceMap = Record<ResourceType, Map<ResourceId, Resource<any>>>

/** @hidden */
export const decodeDocument = <T extends ResourceFormatter>(
  formatters: ReadonlyArray<T>,
  document: ResourceDocument<T>,
  filter: ResourceFilterLimited<T> = EMPTY_OBJECT,
): WithMeta<NaiveResource<T>> => {
  if (!jsonapiDocument.predicate(document)) {
    console.error(ValidationErrorMessage.InvalidResourceDocument, document)
    throw new ResourceValidationError(ValidationErrorMessage.InvalidResourceDocument, document, [])
  }

  if ('errors' in document) {
    console.error(ValidationErrorMessage.JSONAPIDocumentWithErrors, document)
    throw new ResourceDocumentError(
      ValidationErrorMessage.JSONAPIDocumentWithErrors,
      document,
      document.errors as ReadonlyArray<ErrorObject>,
    )
  }

  const { included = [], meta = null, links = null } = document
  const baseIncludedResourceMap: BaseIncludedResourceMap = Object.create(null)

  if (isArray(document.data)) {
    const data: Array<NaiveResource<T>> = []
    const errors: Array<ResourceValidationErrorObject> = []

    document.data.forEach((resourceObject) => {
      const [resource, resourceErrors] = decodeResourceObject(
        formatters,
        resourceObject,
        included,
        baseIncludedResourceMap,
        filter.fields || (EMPTY_OBJECT as any),
        filter.include || (EMPTY_OBJECT as any),
        [],
      )
      data.push(resource as any)
      resourceErrors.forEach((error) => errors.push(error))
    })

    if (errors.length) {
      console.error(ValidationErrorMessage.InvalidResourceDocument, errors)

      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        errors,
      )
    }

    return Object.defineProperties(data, {
      [META_ACCESSOR]: {
        enumerable: false,
        writable: false,
        value: meta,
      },
      [LINKS_ACCESSOR]: {
        enumerable: false,
        writable: false,
        value: links,
      },
    }) as any
  } else {
    const [data, errors] = decodeResourceObject(
      formatters,
      document.data as any,
      included,
      baseIncludedResourceMap,
      filter.fields || (EMPTY_OBJECT as any),
      filter.include || (EMPTY_OBJECT as any),
      [],
    )

    if (errors.length) {
      console.error(ValidationErrorMessage.InvalidResourceDocument, errors)
      throw new ResourceValidationError(
        ValidationErrorMessage.InvalidResourceDocument,
        document,
        errors,
      )
    }

    return Object.defineProperties(data, {
      [META_ACCESSOR]: {
        enumerable: false,
        writable: false,
        value: meta,
      },
      [LINKS_ACCESSOR]: {
        enumerable: false,
        writable: false,
        value: meta,
      },
    }) as any
  }
}
