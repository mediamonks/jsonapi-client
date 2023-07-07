import { FilteredResource } from './Resource';
import { Client } from './Client';
import { Result } from '../utils/Result';
import { CollectionResult, EntityResult } from './Result';

import { url, data, rawPostResource } from '../../test/mocks';
import { Author, Post, Comment } from '../../test/resources';
import { Endpoint } from './Endpoint';

describe('Endpoint', () => {
  describe('constructor', () => {
    it('should create a new instance', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint).toBeInstanceOf(Endpoint);
    });
  });

  describe('create', () => {
    it('should create a resource item', async () => {
      const client = new Client(url, {
        fetchAdapter() {
          return Promise.resolve({
            ok: true,
            status: 200,
            json() {
              return Promise.resolve(rawPostResource);
            },
          } as any);
        },
      });
      const postEndpoint = new Endpoint(client, Post);
      const postData = {
        type: 'Post' as const,
        id: 'post-01',
        title: 'First Post',
        content: 'ABC',
        author: {
          type: 'Author' as const,
          id: 'author-01',
        },
        comments: [],
      };
      const result = await postEndpoint.create(postData);
      expect(result.data).toMatchObject(postData);
    });
  });

  describe('patch', () => {
    // it('should patch a resource item', async () => {
    //   const client = new Client(url, {
    //     fetchAdapter() {
    //       return Promise.resolve({
    //         ok: true,
    //         status: 200,
    //         json() {
    //           return Promise.resolve(rawPostResource)
    //         },
    //       } as any)
    //     },
    //   })
    //   const postEndpoint = new Endpoint(client, Post)
    //   const postData = {
    //     type: 'Post' as const,
    //     id: 'post-01',
    //     title: 'First Post',
    //     content: 'ABC',
    //     author: {
    //       type: 'Author' as const,
    //       id: 'author-01',
    //     },
    //     comments: [],
    //   }
    //   const result = await postEndpoint.patch('post-01', postData)
    //   expect(result.data).toMatchObject(postData)
    // })
  });

  describe('getOne', () => {
    it('should get a resource item', async () => {
      const client = new Client(url);
      const endpoint = client.endpoint(Post);

      const mockHandleRequest = jest.fn().mockResolvedValue(
        Result.accept({
          data: data.Post.p1,
        }),
      );

      client.controller.handleRequest = mockHandleRequest;

      const result = await endpoint.getOne('123', {});

      expect(result.data).toMatchObject({
        id: 'p1',
        type: 'Post',
        title: 'Post 1',
        content: 'foo',
      });
      expect(result.data).toBeInstanceOf(Post);
      expect(result).toBeInstanceOf(EntityResult);
      expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
        'https://www.example.com/api/posts/123',
      );
    });
  });

  describe('getMany', () => {
    it('should get a list of resources', async () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);

      const mockHandleRequest = jest.fn().mockResolvedValue(
        Result.accept({
          data: [data.Post.p1],
        }),
      );

      client.controller.handleRequest = mockHandleRequest;

      let items;
      try {
        items = await endpoint.getMany(null, { fields: { Post: ['title', 'content'] } });
      } catch (errors) {
        console.log(errors);
        throw errors;
      }

      expect(items.data).toEqual([
        {
          id: 'p1',
          type: 'Post',
          title: 'Post 1',
          content: 'foo',
        },
      ]);
      expect(items.data[0]).toBeInstanceOf(Post);
      expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
        'https://www.example.com/api/posts?fields%5BPost%5D=title%2Ccontent',
      );
    });
  });

  describe('getToOneRelationship', () => {
    it('should fetch a one-to-one relationship', async () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);

      const mockHandleRequest = jest.fn().mockResolvedValue(
        Result.accept({
          data: data.Author.a1,
        }),
      );

      client.controller.handleRequest = mockHandleRequest;

      let item: EntityResult<FilteredResource<Author, { fields: { Author: ['name'] } }>, any>;
      try {
        item = await endpoint.getToOneRelationship('123', 'author', {
          fields: { Author: ['name'] } as const,
        });
      } catch (errors) {
        console.log(errors);
        throw errors;
      }
      if (item) {
        expect(item.data).toEqual({
          id: 'a1',
          type: 'Author',
          name: 'Narie',
        });
        expect(item.data).toBeInstanceOf(Author);
        expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
          'https://www.example.com/api/posts/123/author?fields%5BAuthor%5D=name',
        );
      }
    });
  });

  describe('getToManyRelationship', () => {
    it('should fetch a one-to-many relationship', async () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);

      const mockHandleRequest = jest.fn().mockResolvedValue(
        Result.accept({
          data: [data.Comment.c1],
        }),
      );

      client.controller.handleRequest = mockHandleRequest;

      let item: CollectionResult<
        FilteredResource<Comment, { fields: { Comment: ['title'] } }>,
        any
      >;
      try {
        item = await endpoint.getToManyRelationship('123', 'comments', null, {
          fields: { Comment: ['title'] },
        } as const);
      } catch (errors) {
        console.log(errors);
        throw errors;
      }
      if (item) {
        expect(item.data).toEqual([
          {
            id: 'c1',
            type: 'Comment',
            title: 'Comment 1',
          },
        ]);
        expect(item.data[0]).toBeInstanceOf(Comment);
        expect(mockHandleRequest.mock.calls[0][0].href).toEqual(
          'https://www.example.com/api/posts/123/comments?fields%5BComment%5D=title',
        );
      }
    });
  });

  describe('toString', () => {
    it('should return the correct endpoint path with trailing API slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toString()).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path without trailing API slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toString()).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path with leading endpoint slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toString()).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path with trailing endpoint slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toString()).toEqual('https://www.example.com/api/posts');
    });
  });

  describe('toURL', () => {
    it('should return the correct endpoint path with trailing API slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path without trailing API slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path with leading endpoint slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts');
    });

    it('should return the correct endpoint path with trailing endpoint slash', () => {
      const client = new Client(url);
      const endpoint = new Endpoint(client, Post);
      expect(endpoint.toURL().href).toEqual('https://www.example.com/api/posts');
    });
  });
});
