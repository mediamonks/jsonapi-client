import { None, Predicate } from 'isntnt'
import Type from '../../../type'

import {
  AttributeFieldFromFactory,
  AttributeValue,
  AttributeValueFormatter,
  ResourceFieldMaybeMask,
  ResourceFieldFactoryRules,
  AttributeFieldValidator,
} from '../../../types'
import {
  ResourceField,
  ResourceFieldRule,
  ResourceFieldFlag,
  ResourceFieldRoot,
  ResourceFieldMethod,
  resourceFieldMaskIndex,
  ResourceFieldMaskIndex,
} from '..'

const reflect = <T>(value: T): T => value

/*
 * @private
 */
export const defaultAttributeFormatter: AttributeValueFormatter<any, any> = {
  serialize: reflect,
  deserialize: reflect,
}

export const createAttributeFieldFactory = <T extends ResourceFieldFactoryRules>(...rules: T) => <
  U extends AttributeValue,
  V = U
>(
  type: Type<U>,
  formatter: AttributeValueFormatter<U, V> = defaultAttributeFormatter,
): AttributeField<
  V,
  U,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const ruleMasks = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = ruleMasks.reduce((flag, mask) => flag | mask, 0)
  return new AttributeField(flag as any, type, formatter)
}

export class AttributeField<
  T,
  U extends AttributeValue,
  V extends ResourceFieldFlag
> extends ResourceField<ResourceFieldRoot.Attributes, V> {
  readonly type: Type<U>
  readonly serialize: (value: T) => U
  readonly deserialize: (value: U) => T

  constructor(flag: V, validator: Type<U>, formatter: AttributeValueFormatter<U, T>) {
    super(ResourceFieldRoot.Attributes, flag)
    this.type = validator
    this.serialize = formatter.serialize
    this.deserialize = formatter.deserialize
  }

  // validate(
  //   value: unknown,
  //   method: ResourceFieldMethod,
  // ): V extends ResourceFieldMaybeMask ? U | null : U {
  //   if (this.type.predicate(value)) {
  //     return value as any
  //   } else if (this.matches(resourceFieldMaskIndex[method][ResourceFieldRule.Maybe])) {
  //     return null as any
  //   }
  //   if (this.matches(resourceFieldMaskIndex[method][ResourceFieldRule.Never])) {
  //     throw new Error(`Invalid Attribute (...)`)
  //   }
  //   throw new Error(`Invalid Attribute Value (...)`)
  // }
}

export namespace Attribute {
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
