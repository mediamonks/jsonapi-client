import { test } from 'isntnt'
import { Type } from '../../../../../src'

export const url = Type.is('a url string', test(/^https:\/\//)) // this will do

export const urlFormatter = {
  serialize: (url: URL) => url.href,
  deserialize: (value: string) => new URL(value),
}
