import { ResourceFields, ResourceType } from '../types'
import { ResourceFormatter } from './formatter'

export const resource = <T extends ResourceType, U extends ResourceFields>(type: T, fields: U) =>
  new ResourceFormatter(type, fields)
