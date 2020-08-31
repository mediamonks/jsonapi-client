import { ResourceId, ResourceType } from '../types'
import { resourceId, resourceType } from '../util/type-validation'

export class ResourceIdentifier<T extends ResourceType = any> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = resourceType.parse(type) as T
    this.id = resourceId.parse(id)
  }
}
