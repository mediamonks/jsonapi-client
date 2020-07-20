import { test } from 'isntnt'

export const isImageUrl = test(/^https:\/\//) // this will do

export const urlFormatter = {
  serialize: (url: URL) => url.href,
  deserialize: (value: string) => new URL(value),
}
