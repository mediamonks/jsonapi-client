import { isArray } from 'isntnt'
import { ValidationErrorMessage } from '../data/enum'
import {
  ResourceDocumentError,
  ResourceValidationErrorObject,
  ResourceValidationError,
} from '../error'
import {
  JSONAPIDocument,
  Resource,
  ResourceFilterLimited,
  ResourceId,
  ResourceType,
  META_ACCESSOR,
  LINKS_ACCESSOR,
  NaiveResource,
  WithMeta,
} from '../types'
import { EMPTY_OBJECT } from '../data/constants'
import { decodeResourceObject } from './decodeResourceObject'
import type { ResourceFormatter } from '../formatter'
import { jsonapiDocument } from '../util/validators'

export type BaseIncludedResourceMap = Record<ResourceType, Map<ResourceId, Resource<any>>>

/** @hidden */
export const decodeDocument = <T extends ResourceFormatter>(
  formatters: ReadonlyArray<T>,
  document: JSONAPIDocument<T>,
  filter: ResourceFilterLimited<T> = EMPTY_OBJECT,
): WithMeta<NaiveResource<T>> => {
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

  const { included = [], meta = null, links = null } = document
  const baseIncludedResourceMap: BaseIncludedResourceMap = Object.create(null)

  if (isArray(document.data)) {
    const data: Array<NaiveResource<T>> = []
    const errors: Array<ResourceValidationErrorObject> = []

    document.data.forEach((resource) => {
      const [value, resourceErrors] = decodeResourceObject(
        formatters,
        resource,
        included,
        baseIncludedResourceMap,
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
    })
  } else {
    const [data, errors] = decodeResourceObject(
      formatters,
      document.data,
      included,
      baseIncludedResourceMap,
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
    })
  }
}
