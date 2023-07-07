import { isUint } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import Country from './Country';
import Discipline from './Discipline';
import Organisation from './Organisation';

export default class MedalCount extends JSONAPI.resource('MedalCount', 'medal-counts')<MedalCount> {
  @Attribute.required(isUint) public bronze!: number;
  @Attribute.required(isUint) public silver!: number;
  @Attribute.required(isUint) public gold!: number;
  @Attribute.required(isUint) public total!: number;
  @Relationship.toOne(() => Country) public country!: Country | null;
  @Relationship.toOne(() => Organisation) public organisation!: Organisation | null;
  @Relationship.toOne(() => Discipline) public discipline!: Discipline | null;
}
