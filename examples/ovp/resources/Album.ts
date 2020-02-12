import { isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import Media from './Media'

export default class Album extends JSONAPI.resource('Album', 'albums')<Album> {
  @Attribute.required(isString) public title!: string
  @Relationship.toMany(() => Media) public media!: Media[]
}
