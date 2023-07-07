import { isBoolean, isString } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import Competitor from './Competitor';
import Event from './Event';
import EventUnit from './EventUnit';
import Participant from './Participant';
import Organisation from './Organisation';

export default class Medal extends JSONAPI.resource('Medal', 'medals')<Medal> {
  @Attribute.required(isString) public medalType!: string;
  @Attribute.optional(isString) public determinedDate!: string | null;
  @Attribute.required(isBoolean) public perpetual!: boolean;
  @Relationship.toOne(() => Event) public event!: Event | null;
  @Relationship.toOne(() => EventUnit) public eventUnit!: EventUnit | null;
  @Relationship.toOne(() => Competitor) public competitor!: Competitor | null;
  @Relationship.toOne(() => Participant) public participant!: Participant | null;
  @Relationship.toOne(() => Organisation) public organisation!: Organisation | null;
}
