import 'babel-polyfill'

import JSONAPI, { FilteredResource, AnyResource, ResourceIdentifier } from '../../src'

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

// UTILS
type Nullable<T> = T | null

type BaseRelationshipResource<R> = R extends AnyResource | null
  ? Extract<R, AnyResource>
  : R extends Array<AnyResource>
  ? R[number]
  : never

type BaseResourceRelationshipFields<R> = {
  [K in keyof R]: R[K] extends AnyResource | null | AnyResource[] ? K : never
}[keyof R]

type BaseResourceRelationships<R> = {
  [K in BaseResourceRelationshipFields<R>]: BaseRelationshipResource<R[K]>
}

// FILTER INFERENCE
// Fields
type SimplifiedBaseResourceFields<R> = R extends { type: string }
  ? {
      [K in R['type']]: ReadonlyArray<keyof R>
    } &
      {
        [K in keyof R]: R[K] extends AnyResource | null
          ? SimplifiedBaseResourceFields<R[K]>
          : R[K] extends AnyResource[]
          ? SimplifiedBaseResourceFields<R[K][any]>
          : never
      }[keyof R]
  : never

type BaseResourceFields<R, F = {}> = R extends { type: string }
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
  : never

type BaseProcessResourceFields<F> = {
  [K in keyof F]?: F[K]
}

type ResourceFields<R extends AnyResource> = SimplifiedBaseResourceFields<R>
type AltResourceFields<R extends AnyResource> = BaseProcessResourceFields<
  Intersect<SimplifiedBaseResourceFields<R>>
>

type CountryFields = Intersect<ResourceFields<Country>>
type AltCountryFields = AltResourceFields<Country>

type CountryFieldsTypes = keyof CountryFields
type AltCountryFieldsTypes = keyof AltCountryFields

// Include
type BaseExtractResourceIncludes<R> = keyof R extends never
  ? never
  : {
      [K in keyof R]?: BaseResourceIncludes<
        R[K] extends any[] ? R[K][number] : Extract<R[K], AnyResource>
      >
    }

type BaseResourceIncludes<R> = Nullable<BaseExtractResourceIncludes<BaseResourceRelationships<R>>>

type ResourceIncludes<R extends AnyResource> = BaseResourceIncludes<R>

type CountryResourceIncludes = ResourceIncludes<Country>

// FILTER APPLICATION
type GatherFieldsFromResource<R, K, F, I> = R extends { type: string }
  ? K extends keyof R
    ? ResourceIdentifier<R['type']> &
        {
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
    : never
  : never

type BaseFilteredResourceOfType<R, T, F, I> = T extends keyof F
  ? Intersect<GatherFieldsFromResource<R, F[T][any], F, I>>
  : R

type BaseFilteredResource<R, F, I> = R extends { type: string }
  ? R['type'] extends keyof F
    ? Intersect<
        {
          [T in keyof F]: GatherFieldsFromResource<R, F[T][any], F, I>
        }[keyof F]
      >
    : R
  : never

type AltFilteredResource<
  R extends AnyResource,
  F extends AltResourceFilter<R>
> = BaseFilteredResource<R, F['fields'], F['include']>

type AltResourceFilter<R extends AnyResource> = {
  fields?: AltResourceFields<R>
  include?: BaseResourceIncludes<R>
}

type AltFilteredCountry = AltFilteredResource<
  Country,
  {
    fields: {
      Country: ['localName', 'organisation', 'flag']
      Asset: ['name', 'renditions']
      Rendition: ['source']
      Organisation: ['name']
    }
    include: {
      organisation: null
      // participants: null
      flag: {
        renditions: null
      }
    }
  }
>

const fc: AltFilteredCountry = {} as any

fc.organisation

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
