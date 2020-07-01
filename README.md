# jsonapi-client

## Install

```sh
yarn add @mediamonks/jsonapi-client
npm i -S @mediamonks/jsonapi-client
```

## Usage

```typescript
import JSONAPI, { Attribute, Relationship } from '@mediamonks/jsonapi-client'
import { isString } from 'isntnt'

// set up a Resource, passing the `type` and the endpoint path
export class Post extends JSONAPI.resource('Post', 'posts')<Post> {
  @Attribute.required(isString) public title!: string
  @Attribute.optional(isString) public content!: string | null
  @Relationship.toOne(() => Author) public author!: Author | null
  @Relationship.toMany(() => Comment) public comments!: Comment[]
}

// create a client
const url = new URL('http://www.example.com/api')
const client = JSONAPI.client(url)

// create an endpoint
const endpoint = client.endpoint(Post)

// get single item
endpoint.getOne(id, {
  fields: { [Post.type]: ['title, author']},
  includes: { author: null },
}).then(result => console.log('one', result))

// get collection
endpoint.getMany({
  offset: 10,
  limit: 3,
  sort: ['title', '-author'],
  filter: { 'author.id': authorId }
}, {
  fields: { [Post.type]: ['title, author']},
  includes: { author: null },
}).then(results => console.log('many', results))

// create a new resource
endpoint.create({
  title: 'foo',
  content: 'bar'
}).then(result => console.log('new', result))

// patch an existing resource
endpoint.patch(id, {
  title: 'foo',
  content: 'bar'
})

// delete an existing resource
endpoint.delete(id)
```

## Types

Below is a quick reference on the types you'll encounter or use on a daily basis.

**Resource**

* `ResourceId` - a `string`, alias for the resource id
* `ResourceType` - a `string`, alias for the resource type
* `ResourceIdentifier<ResourceType>` - type for a basic resource with id/type fields
* `AnyResource` - an alias for the above, to represent any resource
* `ResourceConstructor<AnyResource>` - type for a resource constructor/class


* `ResourceCreateValues<AnyResource>` - to type data objects to create a specific resource
* `ResourcePatchValues<AnyResource>` - to type data objects to patch a specific resource


* `ResourceParameters<AnyResource>` - a type that represents a resource filter with fields and includes


**Endpoint**

* `Endpoint<AnyResource, ClientSetup>` - to type an Endpoint, potentially for a specific resource
* `EndpointResource<Endpoint<any, any>>` - a helper type to extract a Resource from an Endpoint


* `FilteredResource<AnyResource, ResourceParameters<AnyResource>>` - to type a resource that only contains specific fields (both attributes and nested relationships).
* `ClientSearchParameters<ClientSetup>` - to type the collection query parameters for pagination, sorting, filtering, etc

## Examples

### Filters

Basic example for fetching filtered resources.

```typescript
// create a filter
const postFilter = {
  // It's good practise to specify which fields to return for all resources in the response.
  // It's an object with the resource type as key, and an array with the fields as values.
  // The field array should contain both attributes and relationships.
  // A relationship specified here would only return the ResourceIdentifier (id/type), unless
  // you also include the relationship below .
  fields: {
    [Post.type]: ['name', 'content', 'comments', 'author'],
    [Comment.type]: ['title', 'author'],
    [Author.type]: ['name', 'homepage'],
  },

  // Specify which relationship fields from the above defintion to include as additional resources.
  // The nesting here should follow the one from the Resource field specification.
  // Setting `null` means that resource won't include any others, while an object can be used
  // to specify includes for that nested relationship, and can go many levels deep.
  // As can be seen, author should be included on both the Post and the Comment.
  // The includes object starts with the fields of the Resource to filter, which should
  // also be placed as first Resource in the field list by convention
  include: {
    comments: {
      author: null,
    },
    author: null,
  },
} as const
// note the `as const` - that's needed for type checking

// this type contains only the (nested) field specified in the filter above
type FilteredPost = FilteredResource<Post, postFilter>

let items: Array<FilteredPost>

// the filter itself can be passed to the getOne/getMany methods
endpoint.getMany({}, postFilter).then(result => {
  items = result
})
```

Basic example on how to specify function parameters

```typescript
const postFilter = {
  fields: {
    [Post.type]: ['title', 'author'],
    [Author.type]: ['name'],
  },
  include: { author: null },
} as const

function renderPost(post: FilteredResource<Post, postFilter>) {
  // in here, only a few specific fields of `post` are used
  // so it's good practise to use a filter instead of requesting the full Post type
}

// when not needing nested resources, a `Pick` can be used as well
function renderPost(post: Pick<Post, 'name' | 'author'>) {
  // in here, only a few specific fields of `post` are used
  // so it's good practise to use a filter instead of requesting the full Post type
}
```
