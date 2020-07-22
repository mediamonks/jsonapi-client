import jsonapi, { ResourceFormatter } from 'jsonapi-client'

export type USDFMessageIdType = 'USDFMessageId'

export type USDFMessageIdFields = {}

export type USDFMessageIdResource = ResourceFormatter<USDFMessageIdType, USDFMessageIdFields>

export const usdfMessageId: USDFMessageIdResource = jsonapi.resource('USDFMessageId', {})
