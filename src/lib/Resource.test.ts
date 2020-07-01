import {Post} from "../../test/resources";
import {cloneResourceWithPath} from "./Resource";

describe('Resource', () => {
  describe('cloneResourceWithPath', () => {
    it('should return a cloned resource with updated path', () => {
      expect(Post.path).toEqual('posts')
      expect(cloneResourceWithPath(Post, 'foo').path).toEqual('foo')
    })
  })
})
