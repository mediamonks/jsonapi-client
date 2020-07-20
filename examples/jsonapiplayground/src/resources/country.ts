import JSONAPI, { Attribute, ResourceFormatter } from '../../../../src'

import { string } from './attribute-types/string'

type CountryType = 'countries'

type CountryFields = {
  name: Attribute.Required<string>
}

type CountryResource = ResourceFormatter<CountryType, CountryFields>

const country: CountryResource = JSONAPI.resource('countries', {
  name: Attribute.required(string),
})

export default country
