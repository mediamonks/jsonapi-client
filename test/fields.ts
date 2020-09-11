import { Attribute } from '../src/resource/field/attribute'
import { string } from '../src/util/validators'
import { ResourceFieldFlag } from '../src/data/enum'

export const optionalStringAttribute = Attribute.optional(string)

export const requiredStringAttribute = Attribute.required(string)

export const identityFormatter = {
  serialize: (value: any) => value,
  deserialize: (value: any) => value,
}

export const requiredFieldFlag =
  ResourceFieldFlag.GetRequired | ResourceFieldFlag.PatchRequired | ResourceFieldFlag.PostRequired

export const optionalFieldFlag =
  ResourceFieldFlag.GetOptional | ResourceFieldFlag.PatchOptional | ResourceFieldFlag.PostOptional
