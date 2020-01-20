import { isNumber, isString } from 'isntnt'

import { Media } from './Media'
import { Tag } from './Tag'
import JSONAPI, { Attribute, Relationship } from '../../../src'

export class VOD extends JSONAPI.resource('Vod')<VOD> {
  @Attribute.required(isString) public typeVOD!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public description!: string
  @Attribute.required(isNumber) public duration!: number
  @Relationship.toMany(() => Media) public media!: Media[]
  @Relationship.toMany(() => Tag) public tags!: Tag[]
}
