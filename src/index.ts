import client from './client'
import formatter from './formatter'

export * from './client'
export * from './client/endpoint'
export * from './data/enum'
export * from './resource/field'
export * from './resource/field/attribute'
export * from './formatter'
export * from './resource/field/relationship'
export * from './resource/identifier'
export * from './util/type'
export * from './types'

const JSONAPI = {
  client,
  formatter,
}

export default JSONAPI
