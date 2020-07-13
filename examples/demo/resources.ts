import { isString, test } from 'isntnt'

import { resource, Attribute, Relationship, ResourceConstructor } from '../../src'

// User
type UserType = 'User'

type UserFields = {
  password: Attribute.RequiredWriteOnly<string>
  emailAddress: Attribute.Required<string>
  givenName: Attribute.RequiredReadonly<string>
  familyName: Attribute.RequiredGenerated<string>
  dateOfBirth: Attribute.Optional<string, Date>
  birthCountry: Relationship.ToOne<CountryResource>
  friends: Relationship.ToMany<UserResource>
}

type UserResource = ResourceConstructor<UserType, UserFields>

const isISODateString = test(
  /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/,
)

const dateStringFormatter = {
  serialize: (value: Date) => value.toISOString(),
  deserialize: (value: string) => new Date(value),
}

export const User: UserResource = resource('User', 'users', {
  password: Attribute.requiredWriteOnly(isString),
  emailAddress: Attribute.required(isString),
  givenName: Attribute.requiredReadonly(isString),
  familyName: Attribute.requiredGenerated(isString),
  dateOfBirth: Attribute.optional(isISODateString, dateStringFormatter),
  birthCountry: Relationship.toOne(() => [Country]),
  friends: Relationship.toMany(() => [User]),
})

// Country
type CountryType = 'Country'

type CountryFields = {
  name: Attribute.RequiredReadonly<string>
  locales: Relationship.ToMany<LocaleResource>
  a: Relationship.ToOne<AResource>
}

type CountryResource = ResourceConstructor<CountryType, CountryFields>

const Country: CountryResource = resource('Country', 'countries', {
  name: Attribute.requiredReadonly(isString),
  locales: Relationship.toMany(() => [Locale]),
  a: Relationship.toOne(() => [{} as AResource]),
})

// Locale
type LocaleType = 'Locale'

type LocaleFields = {
  name: Attribute.Required<string>
  code: Attribute.RequiredReadonly<string>
  country: Relationship.ToMany<CountryResource>
}

type LocaleResource = ResourceConstructor<LocaleType, LocaleFields>

const Locale: LocaleResource = resource('Locale', 'locales', {
  name: Attribute.required(isString),
  code: Attribute.requiredReadonly(isString),
  country: Relationship.toMany(() => [Country]),
})

// Virtual Nested Resources
type AResource = ResourceConstructor<
  'A',
  {
    country: Relationship.ToMany<CountryResource>
    x: Relationship.ToMany<BResource>
  }
>

type BResource = ResourceConstructor<
  'B',
  {
    x: Relationship.ToMany<CResource>
  }
>

type CResource = ResourceConstructor<
  'C',
  {
    x: Relationship.ToMany<AResource | DResource>
  }
>

type DResource = ResourceConstructor<
  'D',
  {
    x: Relationship.ToMany<EResource>
  }
>

type EResource = ResourceConstructor<
  'E',
  {
    x: Relationship.ToMany<FResource>
  }
>

type FResource = ResourceConstructor<
  'F',
  {
    x: Relationship.ToMany<GResource>
  }
>

type GResource = ResourceConstructor<
  'G',
  {
    x: Relationship.ToMany<HResource>
  }
>

type HResource = ResourceConstructor<
  'H',
  {
    x: Relationship.ToMany<IResource>
  }
>

type IResource = ResourceConstructor<
  'I',
  {
    x: Relationship.ToMany<JResource>
  }
>

type JResource = ResourceConstructor<
  'J',
  {
    x: Relationship.ToMany<KResource>
  }
>

type KResource = ResourceConstructor<
  'K',
  {
    x: Relationship.ToMany<AResource>
  }
>
