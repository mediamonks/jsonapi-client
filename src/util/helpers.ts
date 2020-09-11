import { ErrorMessage } from '../data/enum'
import { JSONAPIRequestMethod } from '../types'

/** @hidden */
export const reflect = <T>(value: T) => value

/** @hidden */
export const windowFetch: Window['fetch'] =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? fetch.bind(window)
    : () => {
        throw new Error(ErrorMessage.FetchNotFound)
      }
