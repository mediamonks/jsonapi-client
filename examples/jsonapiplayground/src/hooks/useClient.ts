import { createContext, useContext, Context } from 'react'
import { Client } from '@mediamonks/jsonapi-client'

export const ClientContext = createContext<Client<any>>(null as any)

export const useClient = () => useContext(ClientContext as Context<Client<any>>)
