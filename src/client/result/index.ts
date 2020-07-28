import {
  JSONAPIResourceLinks,
  JSONAPIPaginationLinks,
  JSONAPIMetaObject,
  Resource,
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
  constructor(data: T, meta: JSONAPIMetaObject, links: JSONAPIResourceLinks) {
    super(data, meta, links)
  }
}

export class ManyResource<T extends Resource<any>> extends ResourceResult<
  Array<T>,
  JSONAPIResourceLinks & Required<JSONAPIPaginationLinks>
> {
  constructor(
    data: Array<T>,
    meta: JSONAPIMetaObject,
    links: JSONAPIResourceLinks & Required<JSONAPIPaginationLinks>,
  ) {
    super(data, meta, links)
  }

  hasNextPage(): this is { links: { pagination: { next: string } } } {
    return this.links.next != null
  }

  hasPrevPage(): this is { links: { pagination: { prev: string } } } {
    return this.links.prev != null
  }
}
