import { either, isString, test } from 'isntnt'

import { ResourceField } from '../resource/field'
import { Type } from '../type'
import { ResourceFields } from '../types'

const string = Type.is('a string', isString)

export const resourceType = Type.is(
  'a valid resource type',
  test(/^[^-_ ]([a-zA-Z0-9][^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^`{|}~]+)+[^-_ ]$/),
)

const resourceIdentifierKey = Type.is('a resource identifier key', either('type', 'id'))

const legalFieldName = Type.is(
  `a string other than "type" or "id"`,
  (value: unknown): value is string => !resourceIdentifierKey.predicate(value),
)

export const resourceFieldName = Type.and([
  resourceType.withDescription('a valid field name'),
  legalFieldName,
])

export const resourceId = string.withDescription('a resource id')

export const resourceField = Type.instance(ResourceField)

export const parseResourceFields = <T extends ResourceFields>(fields: T): T =>
  Object.keys(fields).reduce((pureFields, key) => {
    const fieldName = resourceFieldName.withPointer([key]).parse(key)
    pureFields[fieldName] = resourceField.withPointer([key]).parse(fields[fieldName])
    return pureFields
  }, Object.create(null))
