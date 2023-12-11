import { Predicate } from 'isntnt'

import {
  ResourceFieldRule,
  ResourceFieldFlag,
  ResourceFieldRoot,
  ResourceFieldMethod,
} from '../../data/enum'
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

type AnyGuard<T, U = never> = Extract<T extends never ? 1 : 0, 1> extends never ? T : U

export const createAttributeFieldFactory = <T extends ResourceFieldFactoryRules>(...rules: T) => <
  U extends AttributeValue,
  V = U
>(
  validator: AttributeFieldValidator<U>,
  formatter: AttributeValueFormatter<U, V> = defaultAttributeFormatter,
): AttributeField<
  AnyGuard<V, U>,
  U,
  | ResourceFieldMaskIndex[ResourceFieldMethod.Get][T[ResourceFieldMethod.Get]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Post][T[ResourceFieldMethod.Post]]
  | ResourceFieldMaskIndex[ResourceFieldMethod.Patch][T[ResourceFieldMethod.Patch]]
> => {
  const maskRules = resourceFieldMaskIndex.map((masks, index) => masks[rules[index]])
  const flag = maskRules.reduce((flag, mask) => flag | mask, 0 as ResourceFieldFlag)
  return new AttributeField(flag as any, validator, formatter as any)
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
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type Optional<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optional
  >

  export const optionalReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Forbidden,
  )

  export type OptionalReadonly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalReadonly
  >

  export const optionalGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Optional,
  )

  export type OptionalGenerated<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalGenerated
  >

  export const optionalStatic = createAttributeFieldFactory(
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
  )

  export type OptionalStatic<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalStatic
  >

  export const optionalWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Forbidden,
  )

  export type OptionalWriteOnce<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalWriteOnce
  >

  export const optionalWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Optional,
    ResourceFieldRule.Optional,
  )

  export type OptionalWriteOnly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof optionalWriteOnly
  >

  export const required = createAttributeFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Required,
    ResourceFieldRule.Required,
  )

  export type Required<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof required
  >

  export const requiredReadonly = createAttributeFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Forbidden,
  )

  export type RequiredReadonly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredReadonly
  >

  export const requiredGenerated = createAttributeFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Optional,
  )

  export type RequiredGenerated<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredGenerated
  >

  export const requiredStatic = createAttributeFieldFactory(
    ResourceFieldRule.Required,
    ResourceFieldRule.Required,
    ResourceFieldRule.Forbidden,
  )

  export type RequiredStatic<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredStatic
  >

  export const requiredWriteOnce = createAttributeFieldFactory(
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Required,
    ResourceFieldRule.Forbidden,
  )

  export type RequiredWriteOnce<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredWriteOnce
  >

  export const requiredWriteOnly = createAttributeFieldFactory(
    ResourceFieldRule.Forbidden,
    ResourceFieldRule.Required,
    ResourceFieldRule.Optional,
  )

  export type RequiredWriteOnly<T extends AttributeValue, U = T> = AttributeFieldFromFactory<
    T,
    U,
    typeof requiredWriteOnly
  >
}
