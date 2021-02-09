import { Attribute, Relationship, ResourceFormatter } from '../../../../../src'

import { number, string } from '../attributes/primitive'
import { isoDateString, isoDateStringFormatter } from '../attributes/date'
import { commaSeparatedListFormatter } from '../attributes/list'
import { participant, ParticipantResource } from './participant'

export type IndividualResource = ResourceFormatter<
  'Individual',
  {
    individualType: Attribute.Required<string>
    externalId: Attribute.Required<string>
    ambition: Attribute.Optional<string>
    clubName: Attribute.Optional<string>
    coach: Attribute.Optional<string>
    countryOfBirth: Attribute.Optional<string>
    dateOfBirth: Attribute.Optional<string, Date>
    education: Attribute.Optional<string>
    fullFamilyName: Attribute.Optional<string>
    fullGivenName: Attribute.Optional<string>
    gender: Attribute.Optional<string>
    generalBiography: Attribute.Optional<string>
    generalBiographyPlain: Attribute.Optional<string>
    height: Attribute.Optional<number>
    weight: Attribute.Optional<number>
    hero: Attribute.Optional<string>
    hobbies: Attribute.Optional<string, Array<string>>
    nationality: Attribute.Optional<string>
    nickname: Attribute.Optional<string>
    occupation: Attribute.Optional<string>
    otherSports: Attribute.Optional<string>
    profileImages: Attribute.Optional<string>
    sportingDebut: Attribute.Optional<string>
    startedCompeting: Attribute.Optional<string, Date>
    participants: Relationship.ToMany<ParticipantResource>
  }
>

export const individual: IndividualResource = new ResourceFormatter('Individual', {
  individualType: Attribute.required(string),
  externalId: Attribute.required(string),
  ambition: Attribute.optional(string),
  clubName: Attribute.optional(string),
  coach: Attribute.optional(string),
  countryOfBirth: Attribute.optional(string),
  dateOfBirth: Attribute.optional(isoDateString, isoDateStringFormatter),
  education: Attribute.optional(string),
  fullFamilyName: Attribute.optional(string),
  fullGivenName: Attribute.optional(string),
  gender: Attribute.optional(string),
  generalBiography: Attribute.optional(string),
  generalBiographyPlain: Attribute.optional(string),
  height: Attribute.optional(number),
  weight: Attribute.optional(number),
  hero: Attribute.optional(string),
  hobbies: Attribute.optional(string, commaSeparatedListFormatter),
  nationality: Attribute.optional(string),
  nickname: Attribute.optional(string),
  occupation: Attribute.optional(string),
  otherSports: Attribute.optional(string),
  profileImages: Attribute.optional(string),
  sportingDebut: Attribute.optional(string),
  startedCompeting: Attribute.optional(isoDateString, isoDateStringFormatter),
  participants: Relationship.toMany(() => participant),
})
