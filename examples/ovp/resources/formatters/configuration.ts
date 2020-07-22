import jsonapi, { Attribute, ResourceFormatter } from 'jsonapi-client'
import { Type } from 'jsonapi-client'

import { string } from '../attributes/primitive'

export type ConfigurationType = 'Configuration'

export type ConfigurationFields = {
  key: Attribute.Required<string>
  value: Attribute.Required<{}>
}

export type ConfigurationResource = ResourceFormatter<ConfigurationType, ConfigurationFields>

export const configuration: ConfigurationResource = jsonapi.resource('Configuration', {
  key: Attribute.required(string),
  value: Attribute.required(Type.object),
})
