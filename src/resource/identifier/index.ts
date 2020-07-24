import { isString, test } from 'isntnt'
import { ResourceId, ResourceType } from '../../types'
import { resourceType, resourceId } from '../../util/types'

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = resourceType.parse(type) as T
    this.id = resourceId.parse(id)
  }
}
