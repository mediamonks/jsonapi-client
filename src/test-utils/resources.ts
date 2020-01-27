import { isString } from 'isntnt'

import { resource, Attribute, Relationship } from '..'

export class Post extends resource('Post')<Post> {
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public content!: string
  @Relationship.toOne(() => Author) public author!: Author | null
  @Relationship.toMany(() => Comment) public comments!: Comment[]
}

export class Author extends resource('Author')<Author> {
  @Attribute.required(isString) public name!: string
  @Attribute.optional(isString) public homepage!: string
  @Relationship.toMany(() => Comment) public comments!: Comment[]
  @Relationship.toMany(() => Post) public posts!: Post[]
}

export class Comment extends resource('Comment')<Comment> {
  @Attribute.required(isString) public title!: string
  @Relationship.toMany(() => Author) public author!: Author | null
  @Relationship.toMany(() => Post) public posts!: Post[]
}
