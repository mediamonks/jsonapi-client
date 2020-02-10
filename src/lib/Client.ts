import { ApiController } from './ApiController'
import { mergeDefaultClientSetup, ClientSetupWithDefaults, ClientSetup } from './ClientSetup'
import { Endpoint } from './Endpoint'
import { AnyResource, ResourceConstructor } from './Resource'
import { JSONAPIQueryParameters, JSONAPIParameterValue } from '../utils/url'
import { Transform } from '../types/util'

export class Client<S extends Partial<ClientSetup>> {
  readonly url: URL
  readonly setup: ClientSetupWithDefaults<S>
  readonly controller: ApiController<S>

  constructor(url: URL, setup: S = {} as S) {
    this.url = url
    this.setup = mergeDefaultClientSetup(setup)
    this.controller = new ApiController(this)
  }

  endpoint<R extends AnyResource>(path: string, Resource: ResourceConstructor<R>): Endpoint<R, S> {
    return new Endpoint(this, path, Resource)
  }

  register(...resources: Array<ResourceConstructor<any>>): void {
    console.warn(`Client#register is deprecated`)
  }

  toString(): string {
    return String(this.url)
  }
}

export type JSONAPISearchParameters<S extends Partial<ClientSetup>> = JSONAPIQueryParameters & {
  page?: S['createPageQuery'] extends Transform<infer R, any> ? R : JSONAPIParameterValue
}
