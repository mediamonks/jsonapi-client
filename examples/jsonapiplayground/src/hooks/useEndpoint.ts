import { useEffect, useState } from 'react'
import { Client, Endpoint, ResourceFormatter } from '@mediamonks/jsonapi-client'

export const useEndpoint = <T extends Client<any>, U extends ResourceFormatter<any, any>>(
  client: T,
  path: string,
  resourceFormatter: U,
): Endpoint<any, U> => {
  const [endpoint, setEndpoint] = useState(() => client.endpoint(path, resourceFormatter))

  useEffect(() => {
    setEndpoint(client.endpoint(path, resourceFormatter))
  }, [client, path, resourceFormatter])

  return endpoint
}
