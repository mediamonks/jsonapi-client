import { isString } from 'isntnt'

import JSONAPI, { Attribute, Relationship } from '../dist'

export class Post extends JSONAPI.resource('Post', 'posts')<Post> {
  @Attribute.required(isString) public title!: string
  @Attribute.required(isString) public content!: string
  @Relationship.toOne(() => Author) public author!: Author | null
  @Relationship.toMany(() => Comment) public comments!: Comment[]
}

export class Author extends JSONAPI.resource('Author', 'authors')<Author> {
  @Attribute.required(isString) public name!: string
  @Attribute.optional(isString) public homepage!: string
  @Relationship.toMany(() => Comment) public comments!: Comment[]
  @Relationship.toMany(() => Post) public posts!: Post[]
}

export class Comment extends JSONAPI.resource('Comment', 'comments')<Comment> {
  @Attribute.required(isString) public title!: string
  @Relationship.toMany(() => Author) public author!: Author | null
  @Relationship.toMany(() => Post) public posts!: Post[]
}
