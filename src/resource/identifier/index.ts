import { isString, test, and, at, above } from 'isntnt'
import Type from '../../type'

import { ResourceId, ResourceType } from '../../types'

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = resourceType.parse(type) as T
    this.id = resourceId.parse(id)
  }
}

// Type
const string = Type.is('a string', isString)

export const resourceFieldName = Type.is(
  'a valid field name',
  test(/^[^-_ ]([a-zA-Z0-9][^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^`{|}~]+)+[^-_ ]$/),
).withCode('172')

export const resourceType = resourceFieldName.with({
  description: 'a valid resource type',
  code: '162',
})

const resourceId = string.withCode('123')
