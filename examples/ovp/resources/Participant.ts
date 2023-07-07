import { isNumber, isString, shape, Static } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '../../../src';

import Country from './Country';
import Discipline from './Discipline';
import Individual from './Individual';

export type ParticipantStatistics = Static<typeof isParticipantStatistics>;

export const isParticipantStatistics = shape({
  total: isNumber,
  gold: isNumber,
  silver: isNumber,
  bronze: isNumber,
});

export default class Participant extends JSONAPI.resource(
  'Participant',
  'participants',
)<Participant> {
  @Attribute.required(isString) public participantType!: string;
  @Attribute.required(isString) public name!: string;
  @Attribute.optional(isParticipantStatistics)
  public statistics!: ParticipantStatistics | null;
  @Relationship.toMany(() => Participant) public participants!: Participant[];
  @Relationship.toMany(() => Discipline) public disciplines!: Discipline[];
  @Relationship.toOne(() => Country) public country!: Country | null;
  @Relationship.toOne(() => Individual) public individual!: Individual | null;
}
