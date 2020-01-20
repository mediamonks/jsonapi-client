import { isString } from 'isntnt'
import JSONAPI, { Attribute } from '../../../src'

export class Tag extends JSONAPI.resource('Tag')<Tag> {
  @Attribute.required(isString) public typeTag!: string
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public description!: string
}
