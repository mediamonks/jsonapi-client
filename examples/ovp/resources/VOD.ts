import { either, isNumber, isString } from 'isntnt'

import JSONAPI, { Attribute, Relationship } from '../../../src'

import Asset from './Asset'
import SpriteSheet from './SpriteSheet'
import VideoSession from './VideoSession'

export enum VODVideoType {
  FER = 'fer',
  SHORT_FORM = 'short_form',
}

export const isVODVideoType = either(...Object.values(VODVideoType))

export default class VOD extends JSONAPI.resource('VOD', 'vods')<VOD> {
  @Attribute.required(isVODVideoType) public videoType!: VODVideoType
  @Attribute.optional(isString) public alias!: string | null
  @Attribute.required(isString) public title!: string
  @Attribute.optional(isString) public start!: string | null
  @Attribute.optional(isString) public end!: string | null
  @Attribute.optional(isNumber) public duration!: number | null
  @Attribute.optional(isString) public created!: string | null
  @Attribute.optional(isString) public path!: string | null
  @Attribute.optional(isString) public sviJobId!: string | null
  @Attribute.optional(isString) public sviJobStatus!: string | null
  @Attribute.required(isString) public updated!: string
  @Relationship.toOne(() => VideoSession) public videoSession!: VideoSession | null
  @Relationship.toOne(() => SpriteSheet) public spriteSheet!: SpriteSheet | null
  @Relationship.toOne(() => Asset) public thumbnail!: Asset | null
}
