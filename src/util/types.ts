import { either, isString, test, at, min } from 'isntnt'

import { ResourceField } from '../resource/field'
import { Type } from '../type'
import { ResourceFields, ResourceIdentifierKey } from '../types'

const string = Type.is('a string', isString)

const notEmpty = Type.is('not empty', at('length', min(1)))

/** @hidden */
export const nonEmptyStringArray: Type<Array<string>> = Type.and([
  Type.array(string),
  notEmpty,
]) as any

/** @hidden */
export const resourceType = Type.is(
  'a valid resource type',
  test(/^[^-_ ]([a-zA-Z0-9][^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^`{|}~]+)+[^-_ ]$/),
)

const resourceIdentifierKey: Type<ResourceIdentifierKey> = Type.is(
  'a resource identifier key',
  either('type', 'id'),
)

const legalFieldName: Type<string> = Type.is(
  `a string other than "type" or "id"`,
  (value: unknown): value is string => !resourceIdentifierKey.predicate(value),
)

/** @hidden */
export const resourceFieldName: Type<string> = Type.and([
  resourceType.withDescription('a valid field name'),
  legalFieldName,
])

/** @hidden */
export const resourceId: Type<string> = string.withDescription('a resource id')

/** @hidden */
export const resourceField: Type<ResourceField<any, any>> = Type.instance(ResourceField)

/** @hidden */
export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFields, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFields[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFields
  }, Object.create(null))
