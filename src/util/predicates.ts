import { at, min, test, either, isString, isNumber, or, and } from 'isntnt'

export const isContent = or(isString, isNumber)

export const isNotEmpty = at('length', min(1))

export const isURLString = (value: unknown): value is string => {
  try {
    new URL(value as any)
    return true
  } catch (_) {
    return false
  }
}

export const isResourceIdentifierKey = either('type', 'id')

const testMemberNameStructure = and(test(/^[^ _\-]/), test(/[^ _\-]$/))
const testNoReservedCharacters = test(/^[^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^\`{|}~]+$/)

export const isResourceType = and(testMemberNameStructure, testNoReservedCharacters)
