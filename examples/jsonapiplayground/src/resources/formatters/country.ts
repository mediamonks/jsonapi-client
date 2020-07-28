import jsonapi, { Attribute, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/string'

type CountryResource = ResourceFormatter<
  'countries',
  {
    name: Attribute.Required<string>
  }
>

export const country: CountryResource = jsonapi.formatter('countries', {
  name: Attribute.required(string),
})
