import { Attribute, Relationship, ResourceFormatter } from '../../../index'

import { string, uint } from '../attributes/primitive'
import { tag } from './tag'

export type CommentaryResource = ResourceFormatter<
  'Commentary',
  {
    title: Attribute.Required<string>
    name: Attribute.Required<string>
    language: Attribute.Required<string>
    sortOrder: Attribute.Optional<number>
    tags: Relationship.ToMany<typeof tag>
  }
>

export const commentary: CommentaryResource = new ResourceFormatter('Commentary', {
  title: Attribute.required(string),
  name: Attribute.required(string),
  language: Attribute.required(string),
  sortOrder: Attribute.optional(uint),
  tags: Relationship.toMany(() => tag),
})
