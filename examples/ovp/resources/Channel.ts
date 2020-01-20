import { isNumber, isString } from 'isntnt'
import JSONAPI, { Attribute, Relationship } from '../../../src'

import { VideoSession } from './VideoSession'

export class Channel extends JSONAPI.resource('Channel')<Channel> {
  @Attribute.required(isString) public name!: string
  @Attribute.required(isNumber) public position!: number
  @Relationship.toMany(() => VideoSession) public videoSessions!: VideoSession[]
}
