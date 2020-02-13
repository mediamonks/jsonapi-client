import 'babel-polyfill'

import JSONAPI from '../../src'

import Country from './resources/Country'

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

const countries = client.endpoint(Country)

countries
  .getMany()
  .then(console.log)
  .catch(console.warn)

// Draft
// const country = client.toOne(Country, {
//   fields: {
//     [Country.type]: ['name']
//   } as const,
// })

// country.state // 'idle' | 'loading' | 'syncing' | 'failed' | ''
// country.data // Country | null
// country.load('1413')
// country.read()
// country.sync()
// country.patch()
// country.edit({

// })

// const countries = client.toMany(Country, {
//   fields: {
//     [Country.type]: ['name']
//   } as const,
// })

// countries.load({
//   page: 1,
// })

// countries.read()

// countries.sync()

// countries.next()
// countries.prev()
// countries.hasNext()
// countries.hasPrev()

// countries.subscribe(() => )

// countries.clear()
// countries.dispose()
