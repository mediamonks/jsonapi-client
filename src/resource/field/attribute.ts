import { None, Predicate } from 'isntnt'

import {
  ResourceFieldRule,
  ResourceFieldFlag,
  ResourceFieldRoot,
  ResourceFieldMethod,
} from '../../enum'
import {
  AttributeFieldFromFactory,
  AttributeValue,
  AttributeValueFormatter,
  ResourceFieldFactoryRules,
  AttributeFieldValidator,
} from '../../types'
import { reflect } from '../../util/helpers'
import { resourceFieldMaskIndex, ResourceField, ResourceFieldMaskIndex } from '../field'

const defaultAttributeFormatter: AttributeValueFormatter<any, any> = {
  serialize: reflect,
  deserialize: reflect,
}

export const createAttributeFieldFactory = <T extends ResourceFieldFactoryRules>(...rules: T) => <
  U extends AttributeValue,
  V = U
>(
  validator: AttributeFieldValidator<U>,
  formatter: AttributeValueFormatter<U, V> = defaultAttributeFormatter,
): AttributeField<
  V,
  U,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = maskRules.reduce((flag, mask) => flag | mask, 0 as ResourceFieldFlag)
  return new AttributeField(flag as any, validator, formatter)
}

export class AttributeField<
  T,
  U extends AttributeValue,
  V extends ResourceFieldFlag
> extends ResourceField<ResourceFieldRoot.Attributes, V> {
  readonly validate: (value: unknown) => ReadonlyArray<string>
  readonly predicate: Predicate<U>
  readonly serialize: (value: T) => U
  readonly deserialize: (value: U) => T

  constructor(
    flag: V,
    validator: AttributeFieldValidator<U>,
    formatter: AttributeValueFormatter<U, T>,
  ) {
    super(ResourceFieldRoot.Attributes, flag)
    this.predicate = validator.predicate.bind(validator)
    this.validate = validator.validate.bind(validator)
    this.serialize = formatter.serialize.bind(formatter)
    this.deserialize = formatter.deserialize.bind(formatter)
  }
}

export namespace Attribute {
  export const optional = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type Optional<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optional
  >

  export const optionalReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type OptionalReadonly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalReadonly
  >

  export const optionalGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
  )

  export type OptionalGenerated<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalGenerated
  >

  export const optionalStatic = createAttributeFieldFactory(
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
  )

  export type OptionalStatic<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalStatic
  >

  export const optionalWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Never,
  )

  export type OptionalWriteOnce<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalWriteOnce
  >

  export const optionalWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
    ResourceFieldRule.Maybe,
  )

  export type OptionalWriteOnly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalWriteOnly
  >

  export const required = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
  )

  export type Required<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof required
  >

  export const requiredReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
    ResourceFieldRule.Never,
  )

  export type RequiredReadonly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredReadonly
  >

  export const requiredGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
    ResourceFieldRule.Maybe,
  )

  export type RequiredGenerated<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredGenerated
  >

  export const requiredStatic = createAttributeFieldFactory(
    ResourceFieldRule.Always,
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
  )

  export type RequiredStatic<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredStatic
  >

  export const requiredWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Always,
    ResourceFieldRule.Never,
  )

  export type RequiredWriteOnce<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredWriteOnce
  >

  export const requiredWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Never,
    ResourceFieldRule.Always,
    ResourceFieldRule.Maybe,
  )

  export type RequiredWriteOnly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredWriteOnly
  >
}
