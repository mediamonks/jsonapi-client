declare const Post_base: {
    new <M extends import("../lib/Resource").ResourceFieldsModel<Pick<M, Exclude<keyof M, "type" | "id">>>>(data: import("..").ResourceIdentifier<"Post"> & M): {
        readonly type: "Post";
        readonly id: string;
    };
    type: "Post";
    path: string;
    fields: Record<string, import("../lib/ResourceField").ResourceField<any, any>>;
    isResource(value: unknown): value is import("..").ResourceIdentifier<any>;
};
export declare class Post extends Post_base<Post> {
    title: string;
    content: string;
    author: Author | null;
    comments: Comment[];
}
declare const Author_base: {
    new <M extends import("../lib/Resource").ResourceFieldsModel<Pick<M, Exclude<keyof M, "type" | "id">>>>(data: import("..").ResourceIdentifier<"Author"> & M): {
        readonly type: "Author";
        readonly id: string;
    };
    type: "Author";
    path: string;
    fields: Record<string, import("../lib/ResourceField").ResourceField<any, any>>;
    isResource(value: unknown): value is import("..").ResourceIdentifier<any>;
};
export declare class Author extends Author_base<Author> {
    name: string;
    homepage: string;
    comments: Comment[];
    posts: Post[];
}
declare const Comment_base: {
    new <M extends import("../lib/Resource").ResourceFieldsModel<Pick<M, Exclude<keyof M, "type" | "id">>>>(data: import("..").ResourceIdentifier<"Comment"> & M): {
        readonly type: "Comment";
        readonly id: string;
    };
    type: "Comment";
    path: string;
    fields: Record<string, import("../lib/ResourceField").ResourceField<any, any>>;
    isResource(value: unknown): value is import("..").ResourceIdentifier<any>;
};
export declare class Comment extends Comment_base<Comment> {
    title: string;
    author: Author | null;
    posts: Post[];
}
export {};
