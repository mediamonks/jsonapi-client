import { client } from './client'
import { formatter } from './resource/formatter'

export * from './client'
export * from './client/endpoint'
export * from './resource/field'
export * from './resource/field/attribute'
export * from './resource/formatter'
export * from './resource/field/relationship'
export * from './type'
export * from './types'

export default {
  client,
  formatter,
}
