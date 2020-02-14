import 'babel-polyfill'

import JSONAPI, { FilteredResource } from '../../src'

import Country from './resources/Country'

const url = new URL(`https://content-yog-slb-production.ovpobs.tv/api/`)

const client = JSONAPI.client(url, {
  createPageQuery(page: number) {
    return {
      offset: page - 1,
      limit: 50,
    }
  },
})

const countries = client.endpoint(Country)

type C = FilteredResource<
  Country,
  {
    fields: {
      [Country.type]: ['isoName', 'participants', 'organisation']
    }
  }
>

countries
  .getMany(null, {
    fields: {
      [Country.type]: ['isoName', 'organisation'],
    } as const,
  })
  .then((result) => console.log(result.data))
  .catch(console.warn)
