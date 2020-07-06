import { None } from 'isntnt'

import { createAttributeFieldFactory, ResourceFieldRule } from './field'
import { AttributeFieldFromFactory, AttributeValue } from '../types'

namespace Attribute {
  export const optional = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type Optional<T extends Exclude<AttributeValue, None>, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optional
  >

  export const optionalReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type OptionalReadonly<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof optionalReadonly>

  export const optionalGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
  )

  export type OptionalGenerated<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof optionalGenerated>

  export const optionalStatic = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
  )

  export type OptionalStatic<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof optionalStatic>

  export const optionalWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
  )

  export type OptionalWriteOnce<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof optionalWriteOnce>

  export const optionalWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type OptionalWriteOnly<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof optionalWriteOnly>

  export const required = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
  )

  export type Required<T extends Exclude<AttributeValue, None>, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof required
  >

  export const requiredReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type RequiredReadonly<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof requiredReadonly>

  export const requiredGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
  )

  export type RequiredGenerated<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof requiredGenerated>

  export const requiredStatic = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
  )

  export type RequiredStatic<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof requiredStatic>

  export const requiredWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
  )

  export type RequiredWriteOnce<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof requiredWriteOnce>

  export const requiredWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
  )

  export type RequiredWriteOnly<
    T extends Exclude<AttributeValue, None>,
    U = T
  > = AttributeFieldFromFactory<T, U, typeof requiredWriteOnly>
}

export default Attribute
