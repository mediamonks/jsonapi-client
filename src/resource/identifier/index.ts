import { ResourceId, ResourceType } from '../../types'

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = type
    this.id = id
  }
}
