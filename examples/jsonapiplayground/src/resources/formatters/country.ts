import { Attribute, ResourceFormatter } from '../../../../../src'

import { string } from '../attributes/string'

type CountryResource = ResourceFormatter<
  'countries',
  {
    name: Attribute.Required<string>
  }
>

export const country: CountryResource = new ResourceFormatter('countries', {
  name: Attribute.required(string),
})
