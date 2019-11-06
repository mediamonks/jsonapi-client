import {requiredAttribute, resource, toManyRelationship, toOneRelationship} from "..";
import {isString} from "isntnt";

export class Post extends resource('Post')<Post> {
  @requiredAttribute(isString) public title!: string
  @requiredAttribute(isString) public content!: string

  @toOneRelationship('Author') public author!: Author | null
  @toManyRelationship('Comment') public comments!: Comment[]
}

export class Author extends resource('Author')<Author> {
  @requiredAttribute(isString) public name!: string
  @requiredAttribute(isString) public homepage!: string

  @toManyRelationship('Comment') public comments!: Comment[]
  @toManyRelationship('Post') public posts!: Post[]
}

export class Comment extends resource('Comment')<Comment> {
  @requiredAttribute(isString) public title!: string

  @toOneRelationship('Author') public author!: Author | null
  @toManyRelationship('Post') public posts!: Post[]
}
