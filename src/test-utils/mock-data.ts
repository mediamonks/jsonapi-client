export const mockData = {
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
}
