import { SerializableObject, isString, isObject, isSome, isNone } from 'isntnt'
import {
  AbsolutePathRoot,
  ImplicitInclude,
  RelationshipFieldData,
  RelationshipFieldLinks,
  ValidationErrorMessage,
} from './data/enum'
import { ResourceFormatter } from './formatter'
import type { ResourcePath } from './types'
import { Endpoint } from './client/endpoint'
import { Type } from './util/type'
import { jsonapiFailureDocument, jsonapiSuccessDocument, urlString, url } from './util/validators'
import { reflect, windowFetch } from './util/helpers'
import { ResourceDocumentError } from './error'
import { InternalErrorCode, JSONAPIRequestMethod, JSON_API_MIME_TYPE } from './data/constants'
import { ResourceDocument } from './types/jsonapi'

export type DefaultClientSetup = ClientSetup & {
  absolutePathRoot: AbsolutePathRoot.Domain
  implicitIncludes: ImplicitInclude.None
  relationshipFieldData: RelationshipFieldData.None
  relationshipFieldLinks: RelationshipFieldLinks.None
}

/**
 * @private
 */
export const DEFAULT_CLIENT_SETUP: DefaultClientSetup = {
  absolutePathRoot: AbsolutePathRoot.Domain,
  implicitIncludes: ImplicitInclude.None,
  relationshipFieldData: RelationshipFieldData.None,
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
  relationshipFieldData: RelationshipFieldData
  relationshipFieldLinks: RelationshipFieldLinks
  transformRelationshipPath(path: string, formatter: ResourceFormatter<any, any>): string
  beforeRequest(request: Request): Request | Promise<Request>
  beforeRequestURL(url: URL): URL | Promise<URL>
  beforeRequestHeaders(headers: Headers): Headers | Promise<Headers>
  afterRequest(response: Response): Response | Promise<Response>
  fetchAdapter: Window['fetch']
}

export type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = {
  [P in keyof DefaultClientSetup]: P extends keyof T ? T[P] : DefaultClientSetup[P]
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

  async request<U extends JSONAPIRequestMethod = JSONAPIRequestMethod.Get>(
    url: URL,
    method: U,
    body?: SerializableObject,
  ): Promise<U extends JSONAPIRequestMethod.Get ? ResourceDocument : ResourceDocument | null> {
    return this.beforeRequest(url, method, body).then((request) =>
      this.setup.fetchAdapter!(request).then((response) => this.afterRequest(response, request)),
    ) as any
  }

  protected async beforeRequest(
    initialUrl: URL,
    method: JSONAPIRequestMethod,
    body?: SerializableObject,
  ): Promise<Request> {
    return Promise.all([
      Promise.resolve(this.setup.beforeRequestURL!(initialUrl)),
      Promise.resolve(
        this.setup.beforeRequestHeaders!(
          new Headers(
            (isSome(body) ? ['Accept', 'Content-Type'] : ['Accept']).map((name) => [
              name,
              JSON_API_MIME_TYPE,
            ]),
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

  protected async afterRequest(
    response: Response,
    request: Request,
  ): Promise<ResourceDocument<any> | null> {
    const afterRequestResponse = await this.setup.afterRequest!(response)
    const data = await afterRequestResponse.json()

    if (!afterRequestResponse.ok) {
      if (!jsonapiFailureDocument.predicate(data)) {
        console.error(ValidationErrorMessage.InvalidResourceDocument, data)
        throw new ResourceDocumentError(ValidationErrorMessage.InvalidResourceDocument, data, [])
      }

      console.error(afterRequestResponse.statusText, data)
      throw new ResourceDocumentError(afterRequestResponse.statusText, data, data.errors as any)
    }

    if (request.method === JSONAPIRequestMethod.Delete) {
      return null
    }

    if (isNone(data) && request.method !== JSONAPIRequestMethod.Get) {
      return null
    }

    if (!jsonapiSuccessDocument.predicate(data)) {
      console.error(ValidationErrorMessage.InvalidResourceDocument, data)
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
  relationshipFieldData: Type.either(...Object.values(RelationshipFieldData)).withCode(
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
