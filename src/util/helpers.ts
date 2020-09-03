import { ErrorMessage } from '../enum'

/** @hidden */
export const reflect = <T>(value: T) => value

/** @hidden */
export const windowFetch: Window['fetch'] =
  typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? fetch.bind(window)
    : () => {
        throw new Error(ErrorMessage.FetchNotFound)
      }
