import jsonapi, { ResourceFormatter } from '../../../../../src'

export type USDFMessageIdResource = ResourceFormatter<'USDFMessageId', {}>

export const usdfMessageId: USDFMessageIdResource = jsonapi.formatter('USDFMessageId', {})
