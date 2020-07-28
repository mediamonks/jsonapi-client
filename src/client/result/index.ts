import {
  JSONAPIResourceLinks,
  JSONAPIPaginationLinks,
  JSONAPIMetaObject,
  Resource,
  JSONAPIDocument,
} from '../../types'

export default class ResourceResult<
  T extends Resource<any> | Array<Resource<any>>,
  U extends JSONAPIResourceLinks | Required<JSONAPIPaginationLinks>
> {
  readonly data: T
  readonly meta: JSONAPIMetaObject
  readonly links: U

  constructor(data: T, meta: JSONAPIMetaObject, links: U) {
    this.data = data
    this.meta = meta
    this.links = links
  }
}

export class OneResource<T extends Resource<any>> extends ResourceResult<T, JSONAPIResourceLinks> {
  constructor(data: T, resourceDocument: JSONAPIDocument) {
    super(data, resourceDocument.meta || {}, resourceDocument.links || {})
  }
}

const PAGINATION_LINKS_IDENTITY: Required<JSONAPIPaginationLinks> = {
  first: null,
  prev: null,
  next: null,
  last: null,
}

export class ManyResource<T extends Resource<any>> extends ResourceResult<
  Array<T>,
  JSONAPIResourceLinks & Required<JSONAPIPaginationLinks>
> {
  constructor(data: Array<T>, resourceDocument: JSONAPIDocument) {
    super(data, resourceDocument.meta || {}, {
      ...PAGINATION_LINKS_IDENTITY,
      ...resourceDocument.links,
    })
  }

  hasNextPage(): this is { links: { pagination: { next: string } } } {
    return this.links.next !== null
  }

  hasPrevPage(): this is { links: { pagination: { prev: string } } } {
    return this.links.prev !== null
  }
}
