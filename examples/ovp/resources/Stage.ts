import { isString } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import Event from './Event';
import Phase from './Phase';

export default class Stage extends JSONAPI.resource('Stage', 'stages')<Stage> {
  @Attribute.required(isString) public title!: string;
  @Attribute.required(isString) public startDate!: string;
  @Attribute.required(isString) public endDate!: string;
  @Relationship.toMany(() => Phase) public phases!: Phase[];
  @Relationship.toOne(() => Event) public event!: Event | null;
}
