import { isString } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import Competitor from './Competitor';
import EventUnit from './EventUnit';
import Stage from './Stage';

export default class Phase extends JSONAPI.resource('Phase', 'phases')<Phase> {
  @Attribute.required(isString) public title!: string;
  @Attribute.required(isString) public startDate!: string;
  @Relationship.toMany(() => EventUnit) public eventUnits!: EventUnit[];
  @Relationship.toOne(() => Stage) public stage!: Stage | null;
  @Relationship.toMany(() => Competitor) public competitors!: Competitor[];
}
