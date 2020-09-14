import {
  formatIncludePointer,
  resourceTypeNotFoundDetail,
  formatFormatterTypes,
} from './formatting'
import { formatterA, formatterB } from '../../test/formatters'

describe('formatting', () => {
  describe('formatFormatterTypes', () => {
    it('wraps formatter types with quotation marks and joins them with a comma', () => {
      expect(formatFormatterTypes([formatterA])).toEqual(`"${formatterA}"`)
      expect(formatFormatterTypes([formatterA, formatterB])).toEqual(
        `"${formatterA}", "${formatterB}"`,
      )
    })
  })

  describe('formatIncludePointer', () => {
    it('joins an array with a dot (".")', () => {
      expect(formatIncludePointer(['FOO', 'BAR'])).toEqual('FOO.BAR')
    })
  })

  describe('resourceTypeNotFoundDetail', () => {
    it('formats a single formatter', () => {
      expect(resourceTypeNotFoundDetail([formatterA])).toEqual(
        `Resource type must equal "${formatterA}"`,
      )
    })

    it('formats multiple formatters', () => {
      expect(resourceTypeNotFoundDetail([formatterA, formatterB])).toEqual(
        `Resource type must equal one of; "${formatterA}", "${formatterB}"`,
      )
    })
  })

  describe('onResourceOfTypeMessage', () => {
    it.todo('')
  })

  describe('invalidFieldsFilterMessage', () => {
    it.todo('')
  })

  describe('invalidIncludeFilterMessage', () => {
    it.todo('')
  })
})
