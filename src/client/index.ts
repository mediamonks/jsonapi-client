import { Serializable, SerializableObject, isString, isAny, isObject } from 'isntnt'

import { ResourceFormatter } from '../resource/formatter'
import { JSONAPIDocument, JSONAPIRequestMethod, ResourcePath } from '../types'
import { Endpoint } from './endpoint'
import { Type } from '../type'
import { urlString, url } from '../util/type-validation'

const JSON_API_MIME_TYPE = 'application/vnd.api+json'

// Whether a relative path that starts with '/' will start from the client url or the url domain
export enum AbsolutePathRoot {
  Domain = 'domain',
  Client = 'client',
}

// To what degree relationship data is included by default
export enum ImplicitIncludes {
  None = 'none',
  All = 'all',
  PrimaryRelationships = 'primary-relationships',
}

export enum InitialRelationshipFieldValue {
  Data, // { data }
  DataWithLinks, // { data, links: { self, related } }
  DataWithSelfLink, // { data, links: { self } }
  DataWithRelatedLink,
  Links,
  SelfLink,
  RelatedLink,
}

export enum RelationshipMeta {
  None,
  Data,
  DataAndLinks,
  DataAndSelfLink,
  DataAndMetaLink,
}

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: AbsolutePathRoot.Domain
  implicitRelationshipData: ImplicitIncludes.None
}

const reflect = <T>(value: T) => value

/**
 * @private
 */
export const defaultClientSetup: DefaultClientSetup = {
  absolutePathRoot: AbsolutePathRoot.Domain,
  implicitRelationshipData: ImplicitIncludes.None,
  transformRelationshipPath: reflect,
  beforeRequestURL: reflect,
  beforeRequestHeaders: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: window.fetch,
}

export type ClientSetup = {
  absolutePathRoot: AbsolutePathRoot
  implicitRelationshipData: ImplicitIncludes
  transformRelationshipPath(path: string): string
  beforeRequest(request: Request): Request | Promise<Request>
  beforeRequestURL(url: URL): URL | Promise<URL>
  beforeRequestHeaders(headers: Headers): Headers | Promise<Headers>
  afterRequest(response: Response): Response | Promise<Response>
  fetchAdapter: Window['fetch']
}

export type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = {
  [P in keyof DefaultClientSetup]: P extends keyof T ? T[P] : DefaultClientSetup[P]
}

export const client = <T extends Partial<ClientSetup> = DefaultClientSetup>(
  url: URL,
  setup?: T,
): Client<ClientSetupWithDefaults<T>> => new Client(url, setup) as any

export class Client<T extends Partial<ClientSetup> = DefaultClientSetup> {
  readonly url: URL
  readonly setup: ClientSetupWithDefaults<T>

  constructor(url: URL | string, setup: T = {} as T) {
    this.url = parseClientURL(url)
    this.setup = parseClientSetup(setup) as any
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
    body?: U extends 'PATCH' | 'POST' ? SerializableObject : never,
  ): Promise<JSONAPIDocument<any> | null> {
    return this.beforeRequest(url, method, body)
      .then(this.setup.fetchAdapter)
      .then((response) => this.afterRequest(response))
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
      Promise.resolve(this.setup.beforeRequestURL!(initialUrl)),
      Promise.resolve(this.setup.beforeRequestHeaders!(initialHeaders)),
    ])
      .then(([url, headers]) =>
        this.setup.beforeRequest!(
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
    return Promise.resolve(this.setup.afterRequest!(response))
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

// Experimental
const createJSONAPITypeCode = (code: number): string => `jsonapi-client:${code}`

const parseClientURL = (value: unknown): URL =>
  isString(value) ? parseClientURL(new URL(urlString.parse(value))) : url.parse(value)

const parseClientSetup = (value: unknown): ClientSetup =>
  isObject(value)
    ? clientSetup.parse({ ...defaultClientSetup, ...value })
    : clientSetup.parse(value)

const clientSetup: Type<ClientSetup> = Type.shape('a valid client setup object', {
  absolutePathRoot: Type.either(...Object.values(AbsolutePathRoot)).withCode(
    createJSONAPITypeCode(150),
  ),
  implicitRelationshipData: Type.either(...Object.values(ImplicitIncludes)).withCode(
    createJSONAPITypeCode(131),
  ),
  transformRelationshipPath: Type.function.withCode(createJSONAPITypeCode(25)),
  beforeRequest: Type.function.withCode(createJSONAPITypeCode(6)),
  beforeRequestURL: Type.function.withCode(createJSONAPITypeCode(153)),
  beforeRequestHeaders: Type.function.withCode(createJSONAPITypeCode(45)),
  afterRequest: Type.function.withCode(createJSONAPITypeCode(12)),
  fetchAdapter: Type.is('any', isAny).withCode(createJSONAPITypeCode(156)),
}).withCode(createJSONAPITypeCode(141))
