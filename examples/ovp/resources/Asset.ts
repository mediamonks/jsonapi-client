import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { Rendition } from './Rendition'

export class Asset extends JSONAPI.resource('Asset')<Asset> {
  @Attribute.required(isString) public assetType!: string
  @Attribute.required(isString) public name!: string
  @Attribute.required(isString) public source!: string
  @Attribute.required(isString) public alt!: string
  @Relationship.toMany(() => Rendition) public renditions!: Rendition[]
}
