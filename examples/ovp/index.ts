import 'babel-polyfill'
import { isSome } from 'isntnt'

import JSONAPI, {
  AnyResource,
  FilteredResource,
  ResourceConstructor,
  ResourceParameters,
} from '../../src'

import { ResourceFieldsParameter } from '../../src/lib/Resource'

import { Country } from './resources/Country'
import { Asset } from './resources/Asset'
import { Medal } from './resources/Medal'
import { EventUnit } from './resources/EventUnit'
import { Participant } from './resources/Participant'
import { Individual } from './resources/Individual'
import { Organisation } from './resources/Organisation'
import { Event } from './resources/Event'
import { Widget } from './resources/Widget'

const url = new URL(`https://content-yog-slb-production.ovpobs.tv/api/`)

const client = JSONAPI.client(url, {
  version: '1.0',
  createPageQuery(page: number) {
    return {
      offset: page - 1,
      limit: 50,
    }
  },
})

type WidgetFields = ResourceFieldsParameter<Widget>
type CountryFields = ResourceFieldsParameter<Country>

type FilteredResourceConstructor<T> = T extends AnyResource ? ResourceConstructor<T> : never

const model = <R extends AnyResource, F extends ResourceParameters<R>>(
  Resource: ResourceConstructor<R>,
  filter: F,
) => {
  abstract class ResourceModel {
    static Resource: ResourceConstructor<R>
    static filter: F
  }
  return (ResourceModel as unknown) as FilteredResourceConstructor<FilteredResource<R, F>>
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

const modifier = <R extends AnyResource, F extends ResourceParameters<R>>(
  Resource: ResourceConstructor<R>,
  filter: F,
): {
  filter: F
  Resource: FilteredResourceConstructor<FilteredResource<R, F>>
} => {
  return {
    filter,
    Resource,
  } as any
}

const countryModifier = modifier(Country, {
  fields: {
    Country: ['localName', 'flag', 'participants'],
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

type FilteredCountry = FilteredResource<Country, typeof countryModifier['filter']>

const fc: FilteredCountry = {} as any

type FcK = typeof fc

type FilteredMedal = FilteredResource<
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

const countries = client.endpoint(Country)

countries
  .getMany(
    {
      page: 1,
    },
    countryModifier['filter'],
  )
  .then((result) => {
    console.log('res', result)
  })
  .catch((err) => {
    console.error('err', err)
  })

// country.href
// country.read()
// country.sync()
// country.read()
// country.patch({
//   localName: 'Holland'
// })

// country.delete()

// const country = countries.getOne('1', {
//   fields: {
//     Country: ['localName'],
//   } as const,
// })

// countries
//   .getMany({
//     page: 1,
//   })
//   .then((result) => {
//     console.log('countries', result.data)
//   })
