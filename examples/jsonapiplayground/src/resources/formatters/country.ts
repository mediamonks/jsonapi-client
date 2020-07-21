import JSONAPI, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'

type CountryType = 'countries'

type CountryFields = {
  name: Attribute.Required<string>
}

type CountryResource = ResourceFormatter<CountryType, CountryFields>

export const country: CountryResource = JSONAPI.resource('countries', {
  name: Attribute.required(string),
})
