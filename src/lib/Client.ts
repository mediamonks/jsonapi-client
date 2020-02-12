import { ApiController } from './ApiController'
import { Endpoint } from './Endpoint'
import { AnyResource, ResourceConstructor } from './Resource'
import { JSONAPISearchParameters, JSONAPIParameterValue } from '../utils/url'
import { Transform } from '../types/util'
import { JSONAPIResponseError } from '../types/data'

const reflect = <T>(value: T): T => value

const mergeClientSetup = (defaults: ClientSetup) => (
  setup: Partial<ClientSetup>,
): ClientSetupWithDefaults<any> => ({
  ...defaults,
  ...setup,
})

export class Client<S extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetupWithDefaults<S>
  readonly controller: ApiController<S>

  constructor(url: URL, setup: S = {} as S) {
    this.url = url
    this.setup = mergeDefaultClientSetup(setup)
    this.controller = new ApiController(this)
  }

  endpoint<R extends AnyResource>(Resource: ResourceConstructor<R>): Endpoint<R, S> {
    return new Endpoint(this, Resource)
  }

  register(...resources: Array<ResourceConstructor<any>>): void {
    console.warn(`Client#register is deprecated`)
  }

  toString(): string {
    return String(this.url)
  }
}

export type ClientSearchParameters<S extends Partial<ClientSetup>> = JSONAPISearchParameters & {
  page?: S['createPageQuery'] extends Transform<infer R, any> ? R : JSONAPIParameterValue
}

type DeprecatedClientSetupKeys = 'adapter'

export type ClientSetup = {
  // version: JSONAPIVersion
  // defaultIncludeFields: DefaultIncludeFieldsOption
  createPageQuery: CreatePageQuery
  transformRelationshipForURL: Transform<string>
  parseRequestError: ParseRequestError
  beforeRequest: Transform<Request>
  fetchAdapter: Window['fetch']
  adapter?: Error & 'Deprecated; use fetchAdapter instead' // TEMP deprecation type
}

export type DefaultClientSetup = ClientSetupWithDefaults<{
  // version: '1.0'
  // defaultIncludeFields: DefaultIncludeFieldsOptions['NONE']
  createPageQuery: CreatePageQuery
  transformRelationshipURLPath: Transform<string>
  parseRequestError: Transform<JSONAPIResponseError, any>
  beforeRequest: Transform<Request>
  fetchAdapter: Window['fetch']
}>

export type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = Required<
  {
    [K in keyof Omit<ClientSetup, DeprecatedClientSetupKeys>]: K extends keyof T
      ? T[K]
      : DefaultClientSetup[K]
  }
>

const windowFetch = (typeof window !== 'undefined' && typeof window.fetch === 'function'
  ? fetch.bind(window)
  : undefined) as Window['fetch']

export const mergeDefaultClientSetup = mergeClientSetup({
  // version: '1.0',
  // defaultIncludeFields: defaultIncludeFieldOptions.NONE,
  createPageQuery: reflect,
  transformRelationshipForURL: reflect,
  parseRequestError: reflect,
  beforeRequest: reflect,
  fetchAdapter: windowFetch,
})

type CreatePageQuery =
  | Transform<string, JSONAPIParameterValue>
  | Transform<number, JSONAPIParameterValue>
  | Transform<JSONAPIParameterValue, JSONAPIParameterValue>

type ParseRequestError = Transform<JSONAPIResponseError, any>
