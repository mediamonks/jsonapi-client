import 'babel-polyfill'

import JSONAPI, {
  FilteredResource,
  AnyResource,
  ResourceIdentifier,
  ResourceIdentifierKey,
  ResourceConstructor,
} from '../../src'

import { Country } from './resources/Country'
import { Asset } from './resources/Asset'
import { Intersect, isSome } from 'isntnt'
import { Medal } from './resources/Medal'
import { EventUnit } from './resources/EventUnit'
import { Participant } from './resources/Participant'
import { Individual } from './resources/Individual'
import { Organisation } from './resources/Organisation'
import { Event } from './resources/Event'
import { Widget } from './resources/Widget'

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

type NonEmptyArray<T> = Array<T> & { 0: T }
type NonEmptyReadonlyArray<T> = ReadonlyArray<T> & { 0: T }

// UTILS
type Nullable<T> = T | null

type BaseRelationshipResource<R> = R extends AnyResource | null
  ? Extract<R, AnyResource>
  : R extends Array<AnyResource>
  ? Extract<R[number], AnyResource>
  : never

type BaseResourceRelationshipFields<R> = {
  [K in keyof R]: R[K] extends AnyResource | null | AnyResource[] ? K : never
}[keyof R]

type BaseResourceRelationships<R> = {
  [K in BaseResourceRelationshipFields<R>]: BaseRelationshipResource<R[K]>
}

// FILTER INFERENCE
// Fields
type BaseResourceFields<R> = R extends AnyResource
  ? {
      [T in R['type']]?: NonEmptyReadonlyArray<keyof R>
    } &
      {
        [K in keyof R]: BaseResourceFields<BaseRelationshipResource<R[K]>>
      }[keyof R]
  : {}

type ProcessResourceFields<F> = Partial<
  Intersect<
    {
      [K in keyof F]: Extract<string, K> extends never ? F[K] : NonEmptyReadonlyArray<string>
    }
  >
>

type ResourceFields<R extends AnyResource> = ProcessResourceFields<BaseResourceFields<R>>

type WidgetFields = ResourceFields<Widget>
type CountryFields = ResourceFields<Country>

// TODO: Find a way to omit the "string" key while preserving literal string keys?
type CountryFieldsTypes = keyof CountryFields

// Include
type BaseExtractResourceIncludes<R> = keyof R extends never
  ? never
  : {
      [K in keyof R]?: BaseResourceIncludes<
        R[K] extends AnyResource[] ? R[K][number] : Extract<R[K], AnyResource>
      >
    }

type BaseResourceIncludes<R> = Nullable<BaseExtractResourceIncludes<BaseResourceRelationships<R>>>

type ResourceIncludes<R extends AnyResource> = BaseResourceIncludes<R>

type CountryResourceIncludes = ResourceIncludes<Medal>

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
    : never
  : never

type BaseFilteredResourceOfType<R, T, F, I> = T extends keyof F
  ? ProcessFilteredResource<GatherFieldsFromResource<R, F[T][any] | ResourceIdentifierKey, F, I>>
  : ProcessFilteredResource<GatherFieldsFromResource<R, keyof R, F, I>>

type BaseFilteredResource<R, F, I> = R extends { type: string }
  ? ProcessFilteredResource<BaseFilteredResourceOfType<R, R['type'], F, I>>
  : never

type ProcessFilteredResource<T> = Intersect<
  {
    [K in keyof T]: T[K]
  }
>

type AltFilteredResource<
  R extends AnyResource,
  F extends AltResourceFilter<R>
> = BaseFilteredResource<R, F['fields'], F['include']>

type AltResourceFilter<R extends AnyResource> = {
  fields?: Readonly<ResourceFields<R>>
  include?: BaseResourceIncludes<R>
}

type FilteredResourceConstructor<T> = T extends AnyResource ? ResourceConstructor<T> : never

const model = <R extends AnyResource, F extends AltResourceFilter<R>>(
  Resource: ResourceConstructor<R>,
  filter: F,
) => {
  abstract class ResourceModel {
    static Resource: ResourceConstructor<R>
    static filter: F
  }
  return (ResourceModel as unknown) as FilteredResourceConstructor<AltFilteredResource<R, F>>
}

class CountryModel extends model(Country, {
  fields: {
    Country: ['localName', 'organisation', 'flag'],
    Asset: ['name', 'renditions'],
    Rendition: ['source'],
    Organisation: ['name'],
  } as const,
  include: {
    organisation: null,
    participants: null,
    flag: {
      renditions: null,
    },
  },
}) {
  hasFlag(): this is CountryModel & { flag: Exclude<CountryModel['flag'], null> } {
    return isSome(this.flag)
  }
}

const cm = new CountryModel({
  type: 'Country',
  id: '',
  localName: '',
  organisation: null,
  flag: null,
})

if (cm.hasFlag()) {
  console.log(cm.flag.name)
}

const modifier = <R extends AnyResource, F extends AltResourceFilter<R>>(
  Resource: ResourceConstructor<R>,
  modifier: F,
): {
  filter: F
  Resource: FilteredResourceConstructor<AltFilteredResource<R, F>>
} => {
  return {
    modifier,
    Resource,
  } as any
}

const countryModifier = modifier(Country, {
  fields: {
    Country: ['localName', 'organisation', 'flag'],
    Asset: ['name', 'renditions'],
    Rendition: ['source'],
    Organisation: ['name'],
  } as const,
  include: {
    organisation: null,
    participants: null,
    flag: {
      renditions: null,
    },
  },
})

type FilteredCountryX = InstanceType<typeof countryModifier['Resource']>

type FilteredCountry = AltFilteredResource<Country, typeof countryModifier['filter']>

const fc: FilteredCountry = {} as any

type FcK = typeof fc

type FilteredMedal = AltFilteredResource<
  Medal,
  {
    fields: {
      [Medal.type]: ['medalType', 'event', 'eventUnit', 'participant', 'organisation']
      [Event.type]: ['name']
      [EventUnit.type]: ['videoSession', 'externalId']
      [Participant.type]: ['participants', 'individual', 'participantType']
      [Individual.type]: ['fullGivenName', 'fullFamilyName']
      [Country.type]: ['localName', 'iso2Code', 'iso3Code', 'iocCode', 'isoName', 'iocName']
      [Organisation.type]: ['name', 'country', 'externalId']
    }
    include: {
      event: null
      eventUnit: null
      organisation: {
        country: null
      }
      participant: {
        individual: null
        participants: {
          individual: null
          participants: {
            individual: null
          }
        }
      }
    }
  }
>

const filteredMedal: FilteredMedal = {} as any

console.log(filteredMedal.eventUnit)

// LEGACY
type FilteredAsset = FilteredResource<Asset, {}>
type LegacyFilteredCountry = FilteredResource<
  Country,
  {
    fields: {
      Country: ['localName']
    }
  }
>

const countries = client.endpoint('countries', Country)

const country = countries.getOne('1', {
  fields: {
    Country: ['localName'],
  } as const,
})

// countries
//   .getMany({
//     page: 1,
//   })
//   .then((result) => {
//     console.log('countries', result.data)
//   })
