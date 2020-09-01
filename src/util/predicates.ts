import { at, min, test, either } from 'isntnt'

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

export const isResourceType = test(
  /^(?! _-)[a-zA-Z0-9][^+,\.\[\]!"#$%&'\(\)\/*:;<=>?@\\^`{|}~]+(\1)$/,
)
