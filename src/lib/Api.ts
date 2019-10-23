import { ApiController } from './ApiController'
import {
  mergeApiDefaultSetup,
  ApiSetupWithDefaults,
  ApiSetup,
} from './ApiSetup'
import { ApiEndpoint } from './ApiEndpoint'
import { AnyResource, ResourceConstructor } from './Resource'

export class Api<S extends Partial<ApiSetup>> {
  readonly url: URL
  readonly setup: ApiSetupWithDefaults<S>

  constructor(url: URL, setup: S = {} as S) {
    this.url = url
    this.setup = mergeApiDefaultSetup(setup)
    ApiController.add(this)
  }

  endpoint<R extends AnyResource>(
    path: string,
    Resource: ResourceConstructor<R>,
  ): ApiEndpoint<R, S> {
    return ApiController.get(this).createApiEndpoint(path, Resource)
  }

  register(...resources: Array<ResourceConstructor<any>>): void {
    resources.forEach((Resource) => {
      ApiController.get(this).addResource(Resource)
    })
  }

  toString(): string {
    return this.url.href
  }
}
