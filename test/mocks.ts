// Mock Window Headers, Request
Object.assign(global, {
  Headers: class MockHeaders {
    append() {}
  },
  Request: class MockRequest {
    constructor(
      public url: string,
      public options: any,
    ) {}
  },
});

export const url = new URL('https://www.example.com/api');

export const rawPostResource = {
  data: {
    type: 'Post',
    id: 'post-01',
    attributes: {
      title: 'First Post',
      content: 'ABC',
    },
    relationships: {
      author: {
        data: {
          type: 'Author',
          id: 'author-01',
        },
      },
    },
  },
  meta: {
    foo: 'Bar',
  },
  included: [
    {
      type: 'Author',
      id: 'author-01',
      attributes: {
        name: 'John Doe',
        homepage: 'https://example.com/',
      },
      relationships: {
        posts: {
          data: [],
        },
        comments: {
          data: [],
        },
      },
    },
  ],
};
export const data = {
  Post: {
    p1: {
      id: 'p1',
      type: 'Post',
      attributes: {
        title: 'Post 1',
        content: 'foo',
      },
      relationships: {
        Author: {
          data: {
            type: 'Author',
            id: 'a1',
          },
        },
      },
    },
  },
  Author: {
    a1: {
      id: 'a1',
      type: 'Author',
      attributes: {
        name: 'Narie',
      },
    },
  },
  Comment: {
    c1: {
      id: 'c1',
      type: 'Comment',
      attributes: {
        title: 'Comment 1',
      },
      relationships: {
        Author: {
          data: {
            type: 'Author',
            id: 'a1',
          },
        },
      },
    },
  },
};
