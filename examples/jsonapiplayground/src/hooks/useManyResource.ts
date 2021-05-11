import { useCallback } from 'react'
import {
  Endpoint,
  JSONAPISearchParams,
  ManyResourceDocument,
  ResourceFilterLimited,
} from '@mediamonks/jsonapi-client'
import { useResource, Resource } from './useResource'

export const useManyResource = <
  T extends Endpoint<any, any>,
  U extends ResourceFilterLimited<T['formatter']>
>(
  endpoint: T,
  resourceFilter?: U,
  searchParams?: JSONAPISearchParams,
): Resource<ManyResourceDocument<T['formatter'], U>> => {
  const getMany = useCallback(
    () => {
      return endpoint.getMany(resourceFilter, searchParams)
    },

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpoint, JSON.stringify(resourceFilter), JSON.stringify(searchParams)],
  )

  return useResource(getMany)
}
