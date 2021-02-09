import { Type } from '../../../index'

import { string } from './primitive'

export type FieldOfPlay = {
  name: string
  total: string
}

export const fieldOfPlay: Type<FieldOfPlay> = Type.shape('a FieldOfPlay object', {
  name: string,
  total: string,
})
