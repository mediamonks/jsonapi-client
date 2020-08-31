import { ResourceFieldFlag } from '../../enum'
import type { ResourceField } from '../field'

/**
 * Returns true if `field` does not match a NeverGet flag
 * @hidden
 * @param field A ResourceField
 * @returns boolean
 */
export const isReadableField = (field: ResourceField): boolean =>
  !field.matches(ResourceFieldFlag.NeverGet)
