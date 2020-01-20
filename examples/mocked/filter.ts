import { AnyResource, ResourceConstructor, ApiQueryResourceParameters } from '../../src'

import { Country } from './index'

const filter = <R extends AnyResource, F extends ApiQueryResourceParameters<R>>(
  Resource: ResourceConstructor<R>,
  filter: F,
): F => {
  return filter
}

const countryFilter = filter(Country, {
  fields: {
    person: ['name'],
    city: ['name'],
  } as const,
  include: {
    cities: null,
  },
})
