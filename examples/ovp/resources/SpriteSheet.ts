import { isString, isUint } from 'isntnt';

import JSONAPI, { Attribute, Relationship } from '../../../src';
import VOD from './VOD';

export default class SpriteSheet extends JSONAPI.resource(
  'SpriteSheet',
  'sprite-sheets',
)<SpriteSheet> {
  @Attribute.required(isUint) public columns!: number;
  @Attribute.required(isUint) public rows!: number;
  @Attribute.required(isUint) public height!: number;
  @Attribute.required(isUint) public width!: number;
  @Attribute.required(isUint) public tileWidth!: number;
  @Attribute.required(isUint) public tileHeight!: number;
  @Attribute.required(isUint) public tiles!: number;
  @Attribute.required(isString) public source!: string;
  @Relationship.toOne(() => VOD) public vod!: VOD | null;
}
