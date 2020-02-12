var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { isString } from 'isntnt';
import JSONAPI, { Attribute, Relationship } from '..';
export class Post extends JSONAPI.resource('Post', 'posts') {
}
__decorate([
    Attribute.required(isString)
], Post.prototype, "title", void 0);
__decorate([
    Attribute.required(isString)
], Post.prototype, "content", void 0);
__decorate([
    Relationship.toOne(() => Author)
], Post.prototype, "author", void 0);
__decorate([
    Relationship.toMany(() => Comment)
], Post.prototype, "comments", void 0);
export class Author extends JSONAPI.resource('Author', 'authors') {
}
__decorate([
    Attribute.required(isString)
], Author.prototype, "name", void 0);
__decorate([
    Attribute.optional(isString)
], Author.prototype, "homepage", void 0);
__decorate([
    Relationship.toMany(() => Comment)
], Author.prototype, "comments", void 0);
__decorate([
    Relationship.toMany(() => Post)
], Author.prototype, "posts", void 0);
export class Comment extends JSONAPI.resource('Comment', 'comments') {
}
__decorate([
    Attribute.required(isString)
], Comment.prototype, "title", void 0);
__decorate([
    Relationship.toMany(() => Author)
], Comment.prototype, "author", void 0);
__decorate([
    Relationship.toMany(() => Post)
], Comment.prototype, "posts", void 0);
//# sourceMappingURL=resources.js.map