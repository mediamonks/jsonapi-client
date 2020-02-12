export declare const url: URL;
export declare const rawPostResource: {
    data: {
        type: string;
        id: string;
        attributes: {
            title: string;
            content: string;
        };
        relationships: {
            author: {
                data: {
                    type: string;
                    id: string;
                };
            };
        };
    };
    meta: {
        foo: string;
    };
    included: {
        type: string;
        id: string;
        attributes: {
            name: string;
            homepage: string;
        };
        relationships: {
            posts: {
                data: never[];
            };
            comments: {
                data: never[];
            };
        };
    }[];
};
export declare const data: {
    Post: {
        p1: {
            id: string;
            type: string;
            attributes: {
                title: string;
                content: string;
            };
            relationships: {
                Author: {
                    data: {
                        type: string;
                        id: string;
                    };
                };
            };
        };
    };
    Author: {
        a1: {
            id: string;
            type: string;
            attributes: {
                name: string;
            };
        };
    };
    Comment: {
        c1: {
            id: string;
            type: string;
            attributes: {
                title: string;
            };
            relationships: {
                Author: {
                    data: {
                        type: string;
                        id: string;
                    };
                };
            };
        };
    };
};
