import { isString, test } from 'isntnt'

import JSONAPI, { Attribute, Relationship, ResourceFormatter, Type } from '../../src'

const string = Type.is('a string', isString)

const dateString = Type.is(
  'an ISO_8601 date string',
  test(
    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/,
  ),
)

const dateStringFormatter = {
  serialize: (value: Date) => value.toISOString(),
  deserialize: (value: string) => new Date(value),
}

// User
export type UserResource = ResourceFormatter<
  'User',
  {
    password: Attribute.RequiredWriteOnly<string>
    emailAddress: Attribute.Required<string>
    givenName: Attribute.RequiredReadonly<string>
    familyName: Attribute.RequiredGenerated<string>
    dateOfBirth: Attribute.Optional<string, Date>
    birthCountry: Relationship.ToOneReadOnly<typeof country>
    friends: Relationship.ToMany<typeof user>
  }
>

export const user: UserResource = JSONAPI.resource('User', {
  password: Attribute.requiredWriteOnly(string),
  emailAddress: Attribute.required(string),
  givenName: Attribute.requiredReadonly(string),
  familyName: Attribute.requiredGenerated(string),
  dateOfBirth: Attribute.optional(dateString, dateStringFormatter),
  birthCountry: Relationship.toOneReadOnly(() => [country]),
  friends: Relationship.toMany(() => [user]),
})

// Country
type CountryResource = ResourceFormatter<
  'Country',
  {
    name: Attribute.RequiredReadonly<string>
    locales: Relationship.ToMany<LocaleResource>
  }
>

const country: CountryResource = JSONAPI.resource('Country', {
  name: Attribute.requiredReadonly(string),
  locales: Relationship.toMany(() => [locale]),
})

// Locale
type LocaleResource = ResourceFormatter<
  'Locale',
  {
    name: Attribute.Required<string>
    code: Attribute.RequiredReadonly<string>
    country: Relationship.ToMany<CountryResource>
  }
>

const locale: LocaleResource = JSONAPI.resource('Locale', {
  name: Attribute.required(string),
  code: Attribute.requiredReadonly(string),
  country: Relationship.toMany(() => [country]),
})
