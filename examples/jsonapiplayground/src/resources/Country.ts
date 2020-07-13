import { isString } from 'isntnt'
import { resource, Attribute, ResourceConstructor } from '../../../../src'

type CountryType = 'countries'

type CountryFields = {
  name: Attribute.Required<string>
}

type CountryResource = ResourceConstructor<CountryType, CountryFields>

const Country: CountryResource = resource('countries', 'countries', {
  name: Attribute.required(isString),
})

export default Country
