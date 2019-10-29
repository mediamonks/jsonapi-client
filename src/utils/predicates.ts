import { at, literal, Predicate } from 'isntnt'

import { ResourceType } from '../lib/Resource'
import { ResourceIdentifier } from '../lib/ResourceIdentifier'

export const createIsResourceOfType = <T extends ResourceType>(
  type: T,
): Predicate<ResourceIdentifier<T>> => at('type', literal(type)) as any
