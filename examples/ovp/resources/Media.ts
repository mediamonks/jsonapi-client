import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Asset from './Asset'
import Stage from './Stage'

export default class Media extends JSONAPI.resource('Media', 'media')<Media> {
  @Attribute.required(isString) public typeMedia!: string
  @Attribute.required(isString) public title!: string
  @Relationship.toMany(() => Asset) public assets!: Asset[]
  @Relationship.toOne(() => Stage) public stage!: Stage | null
}
