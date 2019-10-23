import { ResourceId, ResourceType } from './Resource'

export type AnyResourceIdentifier = ResourceIdentifier<any>

export type ResourceIdentifierKey = keyof AnyResourceIdentifier

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T
  readonly id: ResourceId

  constructor(type: T, id: ResourceId) {
    this.type = type
    this.id = id
  }

  static isResource(value: unknown): value is AnyResourceIdentifier {
    return value instanceof ResourceIdentifier
  }
}
