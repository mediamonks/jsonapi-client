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
export type UserType = 'User'

export type UserFields = {
  password: Attribute.RequiredWriteOnly<string>
  emailAddress: Attribute.Required<string>
  givenName: Attribute.RequiredReadonly<string>
  familyName: Attribute.RequiredGenerated<string>
  dateOfBirth: Attribute.Optional<string, Date>
  birthCountry: Relationship.ToOneReadOnly<typeof country>
  friends: Relationship.ToMany<typeof user>
}

export type UserResource = ResourceFormatter<UserType, UserFields>

export const user: UserResource = JSONAPI.resource('User', {
  password: Attribute.requiredWriteOnly(string),
  emailAddress: Attribute.required(string),
  givenName: Attribute.requiredReadonly(string),
  familyName: Attribute.requiredGenerated(string),
  dateOfBirth: Attribute.optional(dateString, dateStringFormatter),
  birthCountry: Relationship.toOneReadOnly(() => [country]),
  friends: Relationship.toMany(() => [user]),
})

user.getField('password').validate('')

// Country
type CountryType = 'Country'

type CountryFields = {
  name: Attribute.RequiredReadonly<string>
  locales: Relationship.ToMany<LocaleResource>
  a: Relationship.ToOne<AResource>
}

type CountryResource = ResourceFormatter<CountryType, CountryFields>

const country: CountryResource = JSONAPI.resource('Country', {
  name: Attribute.requiredReadonly(string),
  locales: Relationship.toMany(() => [locale]),
  a: Relationship.toOne(() => [{} as AResource]),
})

// Locale
type LocaleType = 'Locale'

type LocaleFields = {
  name: Attribute.Required<string>
  code: Attribute.RequiredReadonly<string>
  country: Relationship.ToMany<CountryResource>
}

type LocaleResource = ResourceFormatter<LocaleType, LocaleFields>

const locale: LocaleResource = JSONAPI.resource('Locale', {
  name: Attribute.required(string),
  code: Attribute.requiredReadonly(string),
  country: Relationship.toMany(() => [country]),
})

// Virtual Nested Resources
type AResource = ResourceFormatter<
  'A',
  {
    country: Relationship.ToMany<CountryResource>
    x: Relationship.ToMany<BResource>
  }
>

type BResource = ResourceFormatter<
  'B',
  {
    x: Relationship.ToMany<CResource>
  }
>

type CResource = ResourceFormatter<
  'C',
  {
    x: Relationship.ToMany<AResource | DResource>
  }
>

type DResource = ResourceFormatter<
  'D',
  {
    x: Relationship.ToMany<EResource>
  }
>

type EResource = ResourceFormatter<
  'E',
  {
    x: Relationship.ToMany<FResource>
  }
>

type FResource = ResourceFormatter<
  'F',
  {
    x: Relationship.ToMany<GResource>
  }
>

type GResource = ResourceFormatter<
  'G',
  {
    x: Relationship.ToMany<HResource>
  }
>

type HResource = ResourceFormatter<
  'H',
  {
    x: Relationship.ToMany<IResource>
  }
>

type IResource = ResourceFormatter<
  'I',
  {
    x: Relationship.ToMany<JResource>
  }
>

type JResource = ResourceFormatter<
  'J',
  {
    x: Relationship.ToMany<KResource>
  }
>

type KResource = ResourceFormatter<
  'K',
  {
    x: Relationship.ToMany<AResource>
  }
>
