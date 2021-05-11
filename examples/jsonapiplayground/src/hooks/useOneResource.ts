import { useCallback } from 'react'
import {
  Endpoint,
  JSONAPISearchParams,
  OneResourceDocument,
  ResourceFilterLimited,
  ResourceId,
} from '@mediamonks/jsonapi-client'
import { useResource, Resource } from './useResource'

export const useOneResource = <
  T extends Endpoint<any, any>,
  U extends ResourceFilterLimited<T['formatter']>
>(
  endpoint: T,
  id: ResourceId,
  resourceFilter?: U,
  searchParams?: JSONAPISearchParams,
): Resource<OneResourceDocument<T['formatter'], U>> => {
  const getOne = useCallback(
    () => endpoint.getOne(id, resourceFilter, searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, id, JSON.stringify(resourceFilter), JSON.stringify(searchParams)],
  )

  return useResource(getOne)
}
