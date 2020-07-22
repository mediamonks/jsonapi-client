import { client } from './client'
import { resource } from './resource'

export * from './client'
export * from './client/endpoint'
export * from './resource'
export * from './resource/field'
export * from './resource/field/attribute'
export * from './resource/formatter'
export * from './resource/field/relationship'
export * from './type'
export * from './types'

const jsonapi = {
  client,
  resource,
}

export default jsonapi
