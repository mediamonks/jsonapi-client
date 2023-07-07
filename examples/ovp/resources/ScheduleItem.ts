import { isNumber, isString } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import EventUnit from './EventUnit';
import Phase from './Phase';
import ScheduleSession from './ScheduleSession';

export default class ScheduleItem extends JSONAPI.resource(
  'ScheduleItem',
  'schedule-items',
)<ScheduleItem> {
  @Attribute.required(isString) public title!: string;
  @Attribute.optional(isString) public start!: string | null;
  @Attribute.optional(isString) public end!: string | null;
  @Attribute.optional(isString) public finishType!: string | null;
  @Attribute.optional(isString) public scheduleSessionId!: string | null;
  @Attribute.optional(isString) public sessionCode!: string | null;
  @Attribute.optional(isString) public startType!: string | null;
  @Attribute.optional(isString) public status!: string | null;
  @Attribute.optional(isString) public subtype!: string | null;
  @Attribute.optional(isNumber) public order!: string | null;
  @Attribute.optional(isString) public awardClass!: string | null;
  @Attribute.optional(isString) public awardSubClass!: string | null;
  @Relationship.toOne(() => ScheduleItem) public scheduleSession!: ScheduleSession | null;
  @Relationship.toMany(() => EventUnit) public eventUnits!: EventUnit[];
  @Relationship.toMany(() => Phase) public phases!: Phase[];
}
