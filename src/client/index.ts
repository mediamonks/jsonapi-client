import { Serializable, SerializableObject } from 'isntnt'

import { ResourceFormatter } from '../resource/formatter'
import { JSONAPIDocument, ResourcePath } from '../types'
import { Endpoint } from './endpoint'

const JSON_API_MIME_TYPE = 'application/vnd.api+json'

type JSONAPIRequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// Whether a relative path that starts with '/' will start from the client url or the url domain
export type AbsolutePathRoot = 'client' | 'domain'

// Whether fields are opt-in or available by default
export type ImplicitResourceFields = 'none' | 'all'

// To what degree relationship data is included by default
export type ImplicitRelationshipData =
  | 'none'
  | 'all'
  | 'primary-relationships'
  | 'resource-identifiers'

// Whether a self-link is present on a relationship field and if so what key it has
type RelationshipSelfLinkKey = null | string

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: 'domain'
  initialResourceFields: 'all'
  initialRelationshipData: 'none'
}

const reflect = <T>(value: T) => value

const defaultClientSetup: DefaultClientSetup = {
  absolutePathRoot: 'domain',
  initialResourceFields: 'all',
  initialRelationshipData: 'none',
  transformRelationshipPath: reflect,
  beforeRequestURL: reflect,
  beforeRequestHeaders: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: window.fetch,
}

export type ClientSetup = {
  absolutePathRoot: AbsolutePathRoot
  initialResourceFields: ImplicitResourceFields
  initialRelationshipData: ImplicitRelationshipData
  transformRelationshipPath(path: string): string
  beforeRequest(request: Request): Request | Promise<Request>
  beforeRequestURL(url: URL): URL
  beforeRequestHeaders(headers: Headers): Headers
  afterRequest(response: Response): Response | Promise<Response>
  fetchAdapter: Window['fetch']
}

export const client = <T extends Partial<ClientSetup>>(url: URL, setup: T) => new Client(url, setup)

export class Client<T extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetup

  constructor(url: URL, setup: T) {
    this.url = url
    this.setup = { ...defaultClientSetup, ...setup } as any
  }

  endpoint<U extends ResourceFormatter<any, any>>(
    path: ResourcePath,
    resource: U,
  ): Endpoint<this, U> {
    return new Endpoint(this, path, resource)
  }

  async request<U extends JSONAPIRequestMethod>(
    url: URL,
    method: U,
    body?: Partial<SerializableObject>,
  ): Promise<JSONAPIDocument<any>> {
    return this.beforeRequest(url, method, body)
      .then(this.setup.fetchAdapter)
      .then(this.afterRequest)
  }

  private async beforeRequest(
    initialUrl: URL,
    method: string,
    body?: Partial<SerializableObject>,
  ): Promise<Request> {
    const initialHeaders = new Headers({
      'Content-Type': JSON_API_MIME_TYPE,
    })
    return Promise.all([
      Promise.resolve(this.setup.beforeRequestURL(initialUrl)),
      Promise.resolve(this.setup.beforeRequestHeaders(initialHeaders)),
    ])
      .then(([url, headers]) =>
        this.setup.beforeRequest(
          new Request(
            url.href,
            body != null
              ? {
                  method,
                  headers,
                  body: JSON.stringify(body),
                }
              : {
                  method,
                  headers,
                },
          ),
        ),
      )
      .catch((error: Error) => {
        throw new Error(error.message)
      })
  }

  private async afterRequest(response: Response): Promise<JSONAPIDocument<any>> {
    return Promise.resolve(this.setup.afterRequest(response))
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText)
        }
        return response.json()
      })
      .then((data: Serializable) => {
        // TODO: Assert if data is JSONAPIDocument<any>
        return data as any
      })
  }
}
