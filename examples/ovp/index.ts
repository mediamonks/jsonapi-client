import 'babel-polyfill'

import JSONAPI, {
  FilteredResource,
  AnyResource,
  ResourceIdentifier,
  ApiQueryResourceParameters,
} from '../../src'

import { Country } from './resources/Country'
import { Asset } from './resources/Asset'
import { Intersect } from 'isntnt'

const url = new URL(`https://example.com/api/v1/`)

const client = JSONAPI.client(url, {
  version: '1.0',
  createPageQuery(page: number) {
    return {
      offset: page - 1,
      limit: 50,
    }
  },
})

// FILTER INFERENCE
// Fields
type BaseResourceFields<R, F> = R extends { type: string }
  ? R['type'] extends keyof F
    ? F
    : {
        [K in R['type']]: ReadonlyArray<keyof R>
      } &
        {
          [K in keyof R]: R[K] extends AnyResource | null
            ? BaseResourceFields<R[K], F>
            : R[K] extends AnyResource[]
            ? BaseResourceFields<R[K][any], F>
            : never
        }[keyof R]
  : F

type ResourceFields<R extends AnyResource> = Intersect<BaseResourceFields<R, {}>>

type CountryFields = ResourceFields<Country>

type X = CountryFields['Medal']
type Y = ApiQueryResourceParameters<Country>

type CountryResourceTypes = keyof CountryFields

// Include
type BaseResourceIncludes<R> = Intersect<
  {
    [K in keyof R]: R[K] extends AnyResource | null
      ? {
          [X in K]: BaseResourceIncludes<Extract<R[K], AnyResource>> | boolean
        }
      : R[K] extends AnyResource[]
      ? {
          [X in K]: BaseResourceIncludes<R[K][number]> | boolean
        }
      : never
  }[keyof R]
>

type ResourceInclude<R extends AnyResource> = BaseResourceIncludes<R>

type CountryIncludes = BaseResourceIncludes<Country>

type Nullable<T> = T | null

// FILTER APPLICATION
type GatherFieldsFromResource<R, K, F, I> = R extends { type: string }
  ? K extends keyof R
    ? {
        [P in K]: R[K] extends AnyResource | null
          ? Nullable<
              K extends keyof I
                ? BaseFilteredResource<Extract<R[K], AnyResource>, F, I[K]>
                : ResourceIdentifier<R['type']>
            >
          : R[K] extends AnyResource[]
          ? Array<
              K extends keyof I
                ? BaseFilteredResource<R[K][any], F, I[K]>
                : ResourceIdentifier<R['type']>
            >
          : R[K]
      }
    : Error & 'K must be a union of R (Resource) field names'
  : Error & 'R must be a Resource'

type BaseFilteredResource<R, F, I> = R extends { type: string }
  ? I extends false
    ? ResourceIdentifier<R['type']>
    : Intersect<
        {
          [T in keyof F]: T extends R['type']
            ? GatherFieldsFromResource<R, F[T][any], F, I>
            : ResourceIdentifier<R['type']>
        }[keyof F]
      >
  : Error & 'R must be a Resource'

type ProcessResource<R, K> = K extends keyof R ? Pick<R, K> : never

type AltFilteredResource<
  R extends AnyResource,
  F extends AltResourceFilter<R>
> = BaseFilteredResource<R, F['fields'], F['include']>

type AltResourceFilter<R> = {
  fields: BaseResourceFields<R, any>
  include: BaseResourceIncludes<R>
}

type AltFilteredCountry = AltFilteredResource<
  Country,
  {
    fields: {
      Country: ['localName', 'organisation', 'flag']
      Asset: ['name', 'renditions']
      Rendition: ['source']
    }
    include: {
      organisation: false
      participants: false
      flag: {
        renditions: true
      }
    }
  }
>

const fc: AltFilteredCountry = {} as any
type FcK = typeof fc

type CountryKey = keyof AltFilteredCountry

// LEGACY
type FilteredAsset = FilteredResource<Asset, {}>
type FilteredCountry = FilteredResource<
  Country,
  {
    fields: {
      Country: ['localName']
    }
    include: {}
  }
>

const countries = client.endpoint('countries', Country)

// countries.getOne('1').then((result) => {
//   console.log(result.data)
// })

// countries
//   .getMany({
//     page: 1,
//   })
//   .then((result) => {
//     console.log('countries', result.data)
//   })
