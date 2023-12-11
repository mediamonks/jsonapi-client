import { isObject, isSome, isString } from 'isntnt'
import { Endpoint } from './client/endpoint'
import { InternalErrorCode, JSONAPIRequestMethod, JSON_API_MIME_TYPE } from './data/constants'
import {
  AbsolutePathRoot,
  ImplicitInclude,
  RelationshipFieldDataType,
  RelationshipFieldLinks,
  ValidationErrorMessage,
} from './data/enum'
import { ResourceDocumentError } from './error'
import type { ResourceFormatter } from './formatter'
import type { ResourcePath } from './types'
import type { ResourceDocument } from './types/jsonapi'
import { reflect, windowFetch } from './util/helpers'
import { Type } from './util/type'
import { jsonapiFailureDocument, jsonapiSuccessDocument, url, urlString } from './util/validators'

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: AbsolutePathRoot.Domain
  implicitIncludes: ImplicitInclude.None
  relationshipFieldData: RelationshipFieldDataType.None
  relationshipFieldLinks: RelationshipFieldLinks.None
}

/**
 * @private
 */
export const DEFAULT_CLIENT_SETUP: DefaultClientSetup = {
  absolutePathRoot: AbsolutePathRoot.Domain,
  implicitIncludes: ImplicitInclude.None,
  relationshipFieldData: RelationshipFieldDataType.None,
  relationshipFieldLinks: RelationshipFieldLinks.None,
  transformRelationshipPath: reflect,
  beforeRequestURL: reflect,
  beforeRequestHeaders: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: windowFetch,
}

export type ClientSetup = {
  absolutePathRoot: AbsolutePathRoot
  implicitIncludes: ImplicitInclude
  relationshipFieldData: RelationshipFieldDataType
  relationshipFieldLinks: RelationshipFieldLinks
  transformRelationshipPath(path: string, formatter: ResourceFormatter<any, any>): string
  beforeRequest(request: Request): Request | Promise<Request>
  beforeRequestURL(url: URL): URL | Promise<URL>
  beforeRequestHeaders(headers: Headers): Headers | Promise<Headers>
  afterRequest(response: Response): Response | Promise<Response>
  fetchAdapter: Window['fetch']
}

export type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = {
  [P in keyof DefaultClientSetup]: P extends keyof T
    ? Exclude<T[P], undefined>
    : DefaultClientSetup[P]
}
export class Client<T extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetupWithDefaults<T>

  constructor(url: URL | string, setup: T = {} as any) {
    this.url = parseClientURL(url)
    this.setup = parseClientSetup(setup) as any
  }

  endpoint<U extends ResourceFormatter>(path: ResourcePath, formatter: U): Endpoint<this, U> {
    return new Endpoint(this, path, formatter)
  }

  async request(
    url: URL,
    method: JSONAPIRequestMethod,
    body?: unknown,
  ): Promise<ResourceDocument | null> {
    const request = await this.beforeRequest(url, method, body)
    const response = await this.setup.fetchAdapter(request)

    return this.afterRequest(response, request)
  }

  protected async beforeRequest(
    initialUrl: URL,
    method: JSONAPIRequestMethod,
    body?: unknown,
  ): Promise<Request> {
    return Promise.all([
      Promise.resolve(this.setup.beforeRequestURL(initialUrl)),
      Promise.resolve(
        this.setup.beforeRequestHeaders(
          new Headers(
            (isSome(body) ? ['Accept', 'Content-Type'] : ['Accept']).map((name) => [
              name,
              JSON_API_MIME_TYPE,
            ]),
          ),
        ),
      ),
    ]).then(([url, headers]) =>
      this.setup.beforeRequest(
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

  protected async afterRequest(
    response: Response,
    request: Request,
  ): Promise<ResourceDocument<any> | null> {
    const afterRequestResponse = await this.setup.afterRequest(response)

    if (
      afterRequestResponse.ok &&
      (request.method === JSONAPIRequestMethod.Delete ||
        request.method === JSONAPIRequestMethod.Patch ||
        afterRequestResponse.status === 204)
    ) {
      return null
    }

    if (request.method === JSONAPIRequestMethod.Post && afterRequestResponse.status === 202) {
      return null
    }

    let data: unknown
    try {
      data = await afterRequestResponse.json()
    } catch {
      throw new ResourceDocumentError(ValidationErrorMessage.InvalidResourceDocument, data, [])
    }

    if (!afterRequestResponse.ok) {
      if (!jsonapiFailureDocument.predicate(data)) {
        throw new ResourceDocumentError(ValidationErrorMessage.InvalidResourceDocument, data, [])
      }

      throw new ResourceDocumentError(afterRequestResponse.statusText, data, data.errors as any)
    }

    if (!jsonapiSuccessDocument.predicate(data)) {
      throw new ResourceDocumentError(ValidationErrorMessage.InvalidResourceDocument, data, [])
    }

    return data as ResourceDocument<any>
  }

  toString(): string {
    return this.url.href
  }
}

// Experimental
const createJSONAPIErrorCode = (code: InternalErrorCode): string => `jsonapi-client:${code}`

const parseClientURL = (value: unknown): URL =>
  isString(value) ? parseClientURL(new URL(urlString.parse(value))) : url.parse(value)

const parseClientSetup = (value: unknown): ClientSetup =>
  isObject(value)
    ? clientSetup.parse({ ...DEFAULT_CLIENT_SETUP, ...value })
    : clientSetup.parse(value)

const clientSetup: Type<ClientSetup> = Type.shape('a valid client setup object', {
  absolutePathRoot: Type.either(...Object.values(AbsolutePathRoot)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupAbsolutePathRootType),
  ),
  implicitIncludes: Type.either(...Object.values(ImplicitInclude)).withCode(
    createJSONAPIErrorCode(InternalErrorCode.InvalidClientSetupImplicitIncludesType),
  ),
  relationshipFieldData: Type.either(...Object.values(RelationshipFieldDataType)).withCode(
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
