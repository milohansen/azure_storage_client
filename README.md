# azure_storage_client

A simple client for Azure Storage REST API.

This client works query builder chaining. Each methods returns a Response object of the Fetch API.

## Usage

You need the connection string for your Azure storage account.
It has at least three fields:

- AccountName=*****;
- AccountKey=*****;
- EndpointSuffix=*****;

It's easy to get from the Azure portal.


```ts
import { Storage } from "https://deno.land/x/azure_storage_client@0.5.0/mod.ts"

let storage = new Storage(/* The connection string here */)
```

## Blob Examples

### Identify the blob

```ts
let blob = await storage
  .container('example') // A container name
  .dir('dir') // A directory name(optional)
  .file('file.txt') // A file name or a file path
```

### Create or Update

```ts
let res = await blob.put(
  new TextEncoder().encode('Hello World'), // Blob or BufferSource
  'text/plain' // Content-Type
)

console.log('isSucceed:': res.ok)
```

### Get

```ts
let text = await blob.get().then(res => res.text())
```

### Delete

```ts
let res = await blob.delete()

console.log('isDeleted:': res.ok)
```

### List

```ts
let xml = await storage
  .container('example')
  .dir('dir') // Optional
  .list()
  .then(res => res.text())
```


## Table Examples

### Identify the entity

```ts
let entity = await storage
  .table('example')
  .partition('abc') // A partition key
  .entity('def') // A row key
```

### Create

```ts
let res = await entity.post({
  prop1: 'value' // A string or number or boolean
  prop2: 100
})

console.log('isSucceed:': res.ok)
```

### Get

```ts
let data = await entity.get().then(res => res.json())
```

### Update

```ts
let res = await entity.merge({
  key2: 400
})

console.log('isSucceed:': res.ok)
```

### Create or Update

```ts
let res = await entity.put({
  key1: 'value'
  key2: 400
})

console.log('isSucceed:': res.ok)
```

### Delete

```ts
let res = await entity.delete()

console.log('isDeleted:': res.ok)
```

### List

```ts
let entities = await storage
  .table('example')
  .partition('abc') // Optional
  .list()
  .then(res => res.json())
```
