import { isObject, and, at, literal, Predicate } from 'isntnt'

import { ResourceType } from '../lib/Resource'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'

const has = <K extends PropertyKey>(key: K) =>
  and(isObject, (value: any): value is Record<K, any> => key in value)

export const hasData = has('data')

export const createIsResourceOfType = <T extends ResourceType>(
  type: T,
): Predicate<ResourceIdentifier<T>> => at('type', literal(type)) as any
