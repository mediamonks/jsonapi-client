import { Attribute, ResourceFormatter } from '../../../../../src'

import { configurationKey, ConfigurationKey } from '../attributes/configurationKey'
import { configurationValue, ConfigurationValue } from '../attributes/configurationValue'

export type ConfigurationResource = ResourceFormatter<
  'Configuration',
  {
    key: Attribute.Required<ConfigurationKey>
    value: Attribute.Required<ConfigurationValue>
  }
>

export const configuration: ConfigurationResource = new ResourceFormatter('Configuration', {
  key: Attribute.required(configurationKey),
  value: Attribute.required(configurationValue),
})
