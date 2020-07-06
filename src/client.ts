import { SerializablePrimitive } from 'isntnt'

import Endpoint from './endpoint'
import { ResourcePath, ResourceConstructor } from './types'

export type ImplicitResourceIncludeFields =
  | 'none'
  | 'all'
  | 'primary-relationships'
  | 'resource-identifiers'

export type DefaultClientSetup = ClientSetup & {
  defaultRelationshipData: 'none'
}

const reflect = <T>(value: T) => value

const defaultClientSetup = {
  defaultRelationshipData: 'none',
  parsePageQuery: reflect,
  transformRelationshipPath: reflect,
  beforeRequest: reflect,
  afterRequest: reflect,
  fetchAdapter: fetch,
}

type ClientSetupWithDefaults<T extends Partial<ClientSetup>> = {
  [P in keyof DefaultClientSetup]: P extends keyof T ? T[P] : DefaultClientSetup[P]
}

type ClientPageQuery = Partial<{
  [name: string]: SerializablePrimitive
}>

export type ClientSetup = {
  defaultRelationshipData: ImplicitResourceIncludeFields
  parsePageQuery: (query: any) => ClientPageQuery
  transformRelationshipPath(path: string): string
  beforeRequest(request: Request): Request | Promise<Request>
  afterRequest(request: Request): Request | Promise<Request>
  fetchAdapter: Window['fetch']
}

export default class Client<T extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetupWithDefaults<T>

  constructor(url: URL, setup: T) {
    this.url = url
    this.setup = { ...defaultClientSetup, ...setup } as ClientSetupWithDefaults<T>
  }

  endpoint<U extends ResourceConstructor<any, any>>(
    path: ResourcePath,
    Resource: U,
  ): Endpoint<Required<T> & DefaultClientSetup, U> {
    return new Endpoint<Required<T> & DefaultClientSetup, U>(this as any, path, Resource)
  }
}
