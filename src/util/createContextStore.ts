import type {
  ResourceObject,
  ResourceDocument,
  MetaObject,
  ResourceDocumentLinks,
  PaginationLinks,
  ResourceIdentifierObject,
} from '../types/jsonapi'

type ContextKey = ResourceIdentifierObject | ReadonlyArray<ResourceIdentifierObject>

type ContextData = Pick<ResourceDocument, 'meta' | 'links'> | Pick<ResourceObject, 'meta' | 'links'>

type ContextMap = WeakMap<ContextKey, ContextData>

/** @hidden */
export const createContextStore = () => {
  const map: ContextMap = new WeakMap()
  return {
    set(key: ContextKey, data: ContextData) {
      const { links, meta } = data
      map.set(key, { links, meta })
    },
    get(key: ContextKey): Required<ContextData> {
      const { links = {}, meta = {} } = map.get(key) || {}
      return {
        links,
        meta,
      }
    },
    getLinks(key: ContextKey): ResourceDocumentLinks | PaginationLinks {
      return this.get(key).links
    },
    getMeta(key: ContextKey): MetaObject {
      return this.get(key).meta
    },
  }
}
