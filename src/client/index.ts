import { Serializable, SerializableObject, isString, isObject, isSome, Predicate } from 'isntnt'

import {
  AbsolutePathRoot,
  ImplicitIncludes,
  InitialRelationshipData,
  RelationshipFieldLinks,
} from '../enum'
import { ResourceFormatter } from '../resource/formatter'
import {
  JSONAPIDocument,
  JSONAPIRequestMethod,
  ResourcePath,
  JSONAPIFailureDocument,
  JSONAPISuccessDocument,
} from '../types'
import { Endpoint } from './endpoint'
import { Type } from '../type'
import { jsonapiFailureDocument, jsonapiSuccessDocument, urlString, url } from '../util/validators'
import { reflect } from '../util/helpers'
import { ClientResponseError } from '../error'
import { InternalErrorCode } from '../util/constants'

const JSON_API_MIME_TYPE = 'application/vnd.api+json'

export { AbsolutePathRoot, ImplicitIncludes, InitialRelationshipData, RelationshipFieldLinks }

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: AbsolutePathRoot.Domain
  implicitIncludes: ImplicitIncludes.None
  initialRelationshipData: InitialRelationshipData.None
  relationshipFieldLinks: RelationshipFieldLinks.None
}

/**
 * @private
 */
export const defaultClientSetup: DefaultClientSetup = {
  absolutePathRoot: AbsolutePathRoot.Domain,
  implicitIncludes: ImplicitIncludes.None,
  initialRelationshipData: InitialRelationshipData.None,
  relationshipFieldLinks: RelationshipFieldLinks.None,
  transformRelationshipPath: reflect,
  beforeRequestURL: reflect,
  beforeRequestHeaders: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: window.fetch.bind(window),
}

export type ClientSetup = {
  absolutePathRoot: AbsolutePathRoot
  implicitIncludes: ImplicitIncludes
  initialRelationshipData: InitialRelationshipData
  relationshipFieldLinks: RelationshipFieldLinks
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

  async request<U extends JSONAPIRequestMethod = 'GET'>(
    url: URL,
    method: U = 'GET' as U,
    body?: U extends 'POST' | 'PATCH' ? SerializableObject : never,
  ): Promise<JSONAPIDocument<any> | null> {
    if (method === 'POST' || method === 'PATCH') {
      if (arguments.length < 3) {
        throw new TypeError(`Request body must be provided with a "${method}" request`)
      }
    } else if (arguments.length > 2) {
      throw new TypeError(`Request body must be omitted with a "${method}" request`)
    }
    return this.beforeRequest(url, method, body).then((request) =>
      this.setup.fetchAdapter!(request).then((response) => this.afterRequest(response, request)),
    )
  }

  private async beforeRequest(
    initialUrl: URL,
    method: JSONAPIRequestMethod,
    body?: SerializableObject,
  ): Promise<Request> {
    return Promise.all([
      Promise.resolve(this.setup.beforeRequestURL!(initialUrl)),
      Promise.resolve(
        this.setup.beforeRequestHeaders!(
          new Headers(
            isSome(body)
              ? {
                  Accept: JSON_API_MIME_TYPE,
                  'Content-Type': JSON_API_MIME_TYPE,
                }
              : {
                  Accept: JSON_API_MIME_TYPE,
                },
          ),
        ),
      ),
    ]).then(([url, headers]) =>
      this.setup.beforeRequest!(
        new Request(
          url.href,
          isSome(body)
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
  }

  private async afterRequest(response: Response, request: Request): Promise<JSONAPIDocument<any>> {
    return Promise.resolve(this.setup.afterRequest!(response))
      .then((response) => {
        // console.log('RESPONSE', response)
        if (!response.ok) {
          return response.json().then((data: Serializable) => {
            // console.log('FAILURE RESPONSE DATA', data)
            if (!(jsonapiFailureDocument.predicate as Predicate<JSONAPIFailureDocument>)(data)) {
              throw new ClientResponseError(`Invalid JSON:API Document`, data, [])
            }
            throw new ClientResponseError(response.statusText, data, data.errors)
          })
        }
        if (request.method === 'GET' && response.status === 204) {
          // Use request data, see https://jsonapi.org/format/#crud-creating-responses-204
          // TODO: Should filter out all non-readable fields to prevent parse errors
          // TODO: Should throw custom error message if a 204 returns non-200 data (missing non-writable fields)
          return request.json()
        }
        return response.json()
      })
      .then((data: Serializable) => {
        // console.log('SUCCESS RESPONSE DATA', data)
        if (!(jsonapiSuccessDocument.predicate as Predicate<JSONAPISuccessDocument>)(data)) {
          throw new ClientResponseError(`Invalid JSON:API Document`, data, [])
        }
        return data
      })
  }
}

// Experimental
const createJSONAPIErrorCode = (code: InternalErrorCode): string => `jsonapi-client:${code}`

const parseClientURL = (value: unknown): URL =>
  isString(value) ? parseClientURL(new URL(urlString.parse(value))) : url.parse(value)

const parseClientSetup = (value: unknown): ClientSetup =>
  isObject(value)
    ? clientSetup.parse({ ...defaultClientSetup, ...value })
    : clientSetup.parse(value)

const clientSetup: Type<ClientSetup> = Type.shape('a valid client setup object', {
  absolutePathRoot: Type.either(...Object.values(AbsolutePathRoot)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupAbsolutePathRootType),
  ),
  implicitIncludes: Type.either(...Object.values(ImplicitIncludes)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupImplicitIncludesType),
  ),
  initialRelationshipData: Type.either(...Object.values(InitialRelationshipData)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupInitialRelationshipDataType),
  ),
  relationshipFieldLinks: Type.either(...Object.values(RelationshipFieldLinks)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupRelationshipLinksType),
  ),
  transformRelationshipPath: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupTransformRelationshipPathType),
  ),
  beforeRequest: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupBeforeRequestType),
  ),
  beforeRequestURL: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupBeforeRequestURLType),
  ),
  beforeRequestHeaders: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupBeforeRequestHeadersType),
  ),
  afterRequest: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupAfterRequestType),
  ),
  fetchAdapter: Type.function.withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupFetchAdapterType),
  ),
}).withCode(createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupType))
