import { isString } from 'isntnt'
import JSONAPI, { Attribute, ResourceFormatter } from '../../../../src'

type CountryType = 'countries'

type CountryFields = {
  name: Attribute.Required<string>
}

type CountryResource = ResourceFormatter<CountryType, CountryFields>

const country: CountryResource = JSONAPI.resource('countries', {
  name: Attribute.required(isString),
})

export default country
