# JSON:API-Client

JSON:API-Client is a JSON:API formatter and client in TypeScript with type safe sparse fieldsets and compound documents.

> ⚠️ This is an experimental branch, its implementation is not completed, not tested, and not production ready.

## JSON:API Support

- [x] Sparse fieldsets
- [x] Compound documents
- [x] Search params (filter, page, sort)
- [x] CRUD operations on a resource
- [x] CRUD operations on a relationship
- [ ] Polymorphic relationships
- [ ] Polymorphic endpoints
- [ ] JSON:API document meta and links
- [ ] Resource object meta and links
- [ ] Resource relationship links
- [ ] Resource identifier meta

## Design Goals

- Improve TS performance and type inference.
- Prevent resource fields and its type representation from going out of sync.
- Resource fields should support read/modify/write rules.
- Resource fields with a NeverGet flag should not be prevented to be included in a ResourceQuery
- Attribute fields should support data serialization.
- Relationships fields should support resources of more than one type.
- Resource query values should no longer be required to be cast `as const`.
- Resource include query values should only allow relationships that are present in its fields query.
- Includes mock tools (experimental)

## Road Map

- Add support for polymorphic relationships and endpoints (maybe)
- Write specs
- Add integration tests
- Docs

# Getting Started

## Define a JSON:API Resource

A JSON:API resource is defined with ResourceFormatter, when a resource has a circular reference (i.e. a resource references itself directly or in one of its descendants) you will need to predefine the formatter type to prevent typescript going berserk. Because your model might change in the future it is recommended to always define your type to prevent seemingly random errors in the future.

For example:

```typescript
type UserFormatter = ResourceFormatter<
  'User',
  {
    emailAddress: Attribute.Required<string>
    password: Attribute.RequiredWriteOnly<string>
    userName: Attribute.RequiredStatic<string>
    dateOfBirth: Attribute.Optional<string, Date>
    role: Attribute.RequiredReadOnly<'admin' | 'editor' | 'subscriber'>
    messages: Attribute.ToManyReadOnly<MessageResource>
    friends: Relationship.ToMany<UserResource>
  }
>

// An attribute field can use a type formatter to (de)serialize its values, for example to
// automatically convert an ISO8601 (date) string to a Date object back and forth.
const dateStringFormatter = {
  serialize: (value: Date) => value.toISOString(),
  deserialize: (value: string) => new Date(value),
}

// Type is an included composable assertion library to check values against their desired types.
const string = Type.is('a string', isString)
const userRole = Type.either('admin', 'editor', 'subscriber')

const userFormatter: UserFormatter = new ResourceFormatter('User', {
  emailAddress: Attribute.required(string),
  password: Attribute.requiredWriteOnly(string),
  userName: Attribute.requiredStatic(string),
  dateOfBirth: Attribute.optional(string, dateStringFormatter),
  role: Attribute.requiredReadOnly(userRole),
  messages: Relationship.toMany(() => message),
  friends: Relationship.toMany(() => user),
})
```

## Create a Client

```typescript
const url = new URL('https://example.com/api/')

const client = new Client(url)
```

## Create an Endpoint

```typescript
const userPath = 'users'

const userEndpoint = client.endpoint(userPath, user)
```

## Create a Resource

```typescript
const myFirstUser = {
  emailAddress: 'jane.smiht@example.com',
  password: 'password1',
  userName: 'jane',
}

userEndpoint.create(myFirstUser).then((user) => {
  console.log(user.messages)
})
```

## Update a Resource

```typescript
const myFirstUserUpdate = {
  emailAddress: 'jane.smith@example.com',
}

userEndpoint.update('1', myFirstUserUpdate)
```

## Get a Single Resource Using a Filter

```typescript
const userEmailFilter = user.createFilter({
  fields: {
    [user.type]: ['emailAddress', 'dateOfBirth'],
  },
})

userEndpoint.getOne('12', userEmailFilter).then((user) => {
  console.log(user)
  /* Resource { 
    type: 'User', 
    id: string,
    emailAddress: string,
    dateOfBirth: Date | null,
  }
  */
})
```

# API (In Progress)

## Resource

### resource

```
(ResourceType, ResourceFields) -> ResourceFormatter
```

ResourceFormatter factory, returns a ResourceFormatter with methods to perform operations on (formatted) JSON:API data for this resource.

### ResourceFormatter#identifier

```
(ResourceId) -> ResourceIdentifier
```

Create a ResourceIdentifier from the Resource static `type` and `id` parameter

### ResourceFormatter#filter

```
(ResourceFieldsQuery, ResourceIncludeQuery) -> ResourceFilter
```

### ResourceFormatter#decode

```
(JSONAPIDocument, ResourceFilter?) -> Resource
```

### ResourceFormatter#createResourcePostObject

```
(ResourcePostData) -> JSONAPIResourceObject
```

### ResourceFormatter#createResourcePatchObject

```
(ResourceId, ResourcePatchData) -> JSONAPIResourceObject
```

## ResourceField

### ResourceField#constructor

```
(ResourceFieldRoot, ResourceFieldFlag) -> ResourceField
```

### ResourceField#matches

```
(ResourceFieldFlag) -> boolean
```

## Attribute

Extends ResourceField

### createAttributeFieldFactory

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<T, AttributeValue, ResourceFieldFlag>
```

## Relationship

Extends ResourceField

### createToOneRelationshipField

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<ResourceConstructor, RelationshipFieldType.ToOne, ResourceFieldFlag>
```

### createToManyRelationshipField

```
([ResourceFieldRule, ResourceFieldRule, ResourceFieldRule]) -> (Predicate, AttributeFieldFormatter) -> AttributeField<ResourceConstructor, RelationshipFieldType.ToMany, ResourceFieldFlag>
```

## Client

### Client#constructor

```
(URL, ClientSetup) -> JSONAPIClient
```

### Client#create

```
async (ResourceConstructor, ResourceCreateData) -> OneResource
```

### Client#update

```
async (ResourceConstructor, ResourceId, ResourcePatchData) -> void
```

### Client#delete

```
async (ResourceConstructor, ResourceId) -> void
```

### Client#updateRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, RelationshipPatchData) -> void
```

### Client#addRelationships

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> void
```

### Client#deleteRelationships

```
async (ResourceConstructor, ResourceId, ToManyRelationshipNameWithFlag, ToManyRelationshipPatchData) -> void
```

### Client#getOne

```
async (ResourceConstructor, ResourceId, ResourceQuery) -> OneResource
```

### Client#getMany

```
async (ResourceConstructor, ClientQuery, ResourceQuery) -> ManyResource
```

### Client#getOneRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipName, ResourceQuery) -> OneResource
```

### Client#getManyRelationship

```
async (ResourceConstructor, ResourceId, ToManyRelationshipName, ResourceQuery) -> ManyResource
```

### Client#one

```
(ResourceConstructor, ResourceQuery) -> (ResourceId) -> OneResource
```

### Client#many

```
(ResourceConstructor, ResourceQuery) -> (ClientQuery) -> ManyResource
```

### Client#toOne

```
(ResourceConstructor, ToOneRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> OneResource
```

### Client#toMany

```
(ResourceConstructor, ToManyRelationshipFieldNameWithFlag, ResourceQuery) -> (ResourceId) -> ManyResource
```

## OneResource

### OneResource#constructor

```
(FilteredResource, JSONAPIMetaObject, JSONAPIResourceLinks) -> OneResource
```

## ManyResource

### ManyResource#constructor

```
(FilteredResource[], JSONAPIMetaObject, JSONAPIResourceLinks & JSONAPIPaginationLinks) -> ManyResource
```
