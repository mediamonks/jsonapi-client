import JSONAPI, { Attribute, ResourceFormatter } from 'jsonapi-client'

import { string } from '../attributes/string'

type CountryResource = ResourceFormatter<
  'countries',
  {
    name: Attribute.Required<string>
  }
>

export const country: CountryResource = JSONAPI.resource('countries', {
  name: Attribute.required(string),
})
