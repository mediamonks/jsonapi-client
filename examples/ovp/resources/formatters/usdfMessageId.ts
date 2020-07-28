import jsonapi, { ResourceFormatter } from 'jsonapi-client'

export type USDFMessageIdResource = ResourceFormatter<'USDFMessageId', {}>

export const usdfMessageId: USDFMessageIdResource = jsonapi.formatter('USDFMessageId', {})
