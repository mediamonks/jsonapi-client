import { Api } from './Api'
import { ApiQuery, FetchQueryParameters } from './ApiQuery'
import { ApiSetup } from './ApiSetup'
import { AnyResource, ResourceConstructor } from './Resource'
import { ResourceIdentifierKey, ResourceIdentifier } from './ResourceIdentifier'
import { ApiController } from './ApiController'

const defaultFetchQueryParameters: FetchQueryParameters<any, any> = {}

export class ApiEndpoint<R extends AnyResource, S extends Partial<ApiSetup>> {
  readonly api: Api<S>
  readonly path: string
  readonly Resource: ResourceConstructor<R>

  constructor(api: Api<S>, path: string, Resource: ResourceConstructor<R>) {
    this.api = api
    this.path = path
    this.Resource = Resource
  }

  async create(data: R): Promise<R> {
    return new this.Resource(data)
  }

  async get<Q extends FetchQueryParameters<R, S>>(
    id: string,
    query: Q = defaultFetchQueryParameters as Q,
  ): Promise<FilteredResource<R, S, Q>[]> {
    const controller = ApiController.get(this.api)
    const queryParameters = this.createQuery(query)
    const url = new URL(String(queryParameters), this.toURL())
    const response = await fetch(url.href)
    const resource = await response.json()

    return controller.decodeResource(
      this.Resource,
      resource.data,
      resource.included,
      query.fields || {},
      query.include as any,
    ) as any
  }

  async fetch<Q extends FetchQueryParameters<R, S>>(
    query: Q = defaultFetchQueryParameters as Q,
  ): Promise<FilteredResource<R, S, Q>[]> {
    const controller = ApiController.get(this.api)
    const queryParameters = this.createQuery(query)
    const url = new URL(String(queryParameters), this.toURL())
    return fetch(url.href).then((response: any) =>
      // (console.log(response) as any) ||
      response.data.map((data: any) =>
        controller.decodeResource(
          this.Resource,
          data,
          response.included,
          query.fields || {},
          query.include as any,
        ),
      ),
    )
  }

  toString(): string {
    return `${this.api}/${this.path}`
  }

  toURL(): URL {
    return new URL(this.path, this.api.url)
  }

  createQuery<Q extends FetchQueryParameters<R, S>>(query: Q): ApiQuery<Q> {
    return new ApiQuery(this.api, query)
  }
}

type ResourceFields<R, F> = R extends AnyResource
  ? F extends Array<keyof R>
    ? Pick<R, F[number] | ResourceIdentifierKey>
    : Warning<'Invalid fields parameter: field does not exist on resource', F>
  : never

type ToManyRelationshipIdentifier<R> = R extends Array<AnyResource>
  ? ResourceIdentifier<R[number]['type']>[]
  : never

type ResourceIncludes<R, I, F> = R extends AnyResource
  ? {
      [K in keyof R]: R[K] extends Array<AnyResource>
        ? K extends keyof I
          ? FilteredToManyRelationship<R[K], I[K], F>
          : ToManyRelationshipIdentifier<R[K]>
        : R[K] extends AnyResource | null
        ? K extends keyof I
          ? BaseFilteredResource<Extract<R[K], AnyResource>, I[K], F> | null
          : ResourceIdentifier<Extract<R[K], AnyResource>['type']>
        : K extends keyof I
        ? Warning<'Invalid include parameter: field is not a relationship', K>
        : R[K]
    }
  : NotAResourceWarning<R>

type BaseFilteredResourceOfType<T, R, I, F> = T extends keyof F
  ? ResourceIncludes<ResourceFields<R, F[T]>, I, F>
  : ResourceIncludes<R, I, F>

type BaseFilteredResource<R, I, F> = R extends AnyResource
  ? BaseFilteredResourceOfType<R['type'], R, I, F>
  : NotAResourceWarning<R>

type FilteredToManyRelationship<R, I, F> = R extends Array<AnyResource>
  ? Array<BaseFilteredResource<R[number], I, F>>
  : NotAResourceWarning<R>[]

// test: use ApiEndpoint as ResourceFilter
type FilterEndpointResource<
  E extends ApiEndpoint<any, any>,
  Q extends FetchQueryParameters<
    InstanceType<E['Resource']>,
    ApiSetupValues<E['api']>
  >
> = FilteredResource<InstanceType<E['Resource']>, ApiSetupValues<E['api']>, Q>

type ApiSetupValues<A extends Api<any>> = A extends Api<infer S> ? S : never

type FilteredResource<
  R extends AnyResource,
  S extends Partial<ApiSetup>,
  Q extends FetchQueryParameters<R, S>
> = BaseFilteredResource<R, Q['include'], Q['fields']>

type Warning<T extends string, U> = Error & {
  message: T
  value: U
}

type NotAResourceWarning<T> = Warning<'Not a Resource', T>
