import {
  JSONAPIResourceObject,
  JSONAPIDocument,
  JSONAPIMetaObject,
  JSONAPILinksObject,
  JSONAPIPaginationLinks,
} from '../types'
import { ResourceIdentifier } from '../resource/identifier'

type ContextKey = ResourceIdentifier | ReadonlyArray<ResourceIdentifier>

type ContextData =
  | Pick<JSONAPIDocument, 'meta' | 'links'>
  | Pick<JSONAPIResourceObject, 'meta' | 'links'>

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
    getLinks(key: ContextKey): JSONAPILinksObject | JSONAPIPaginationLinks {
      return this.get(key).links
    },
    getMeta(key: ContextKey): JSONAPIMetaObject {
      return this.get(key).meta
    },
  }
}
