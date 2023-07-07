import { ResourceId, ResourceType } from './Resource';

export type ResourceIdentifierKey = keyof ResourceIdentifier<any>;

export class ResourceIdentifier<T extends ResourceType> {
  readonly type: T;
  readonly id: ResourceId;

  constructor(type: T, id: ResourceId) {
    this.type = type;
    this.id = id;
  }
}
