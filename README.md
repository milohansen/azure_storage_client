# azure_storage_client

A simple client for Azure Storage REST API.

## Usage

You need a connection string for your an Azure storage account.
It has at least three fields:

- AccountName=*****;
- AccountKey=*****;
- EndpointSuffix=*****;

You can get it from the Azure portal.


```ts
import { Storage } from "https://deno.land/x/azure_storage_client@0.4.0/mod.ts"

let storage = new Storage(/* Connection string here */)

```

## Blob Examples

Each method returns a Response object.

### Create or Update

```ts
let res = await storage
  .container('example') // A container name
  .dir('dir') // A directory name
  .file('file.txt') // A file name
  .put(
    new TextEncoder().encode('Hello World'), // Blob or BufferSource
    'text/plain' // Content-Type
  )

console.log('isSucceed:': res.ok)
```

### Get

```ts
let text = await storage
  .container('example')
  .dir('dir')
  .file('file.txt')
  .get()
  .then(res => res.text())
```

### List

```ts
let text = await storage
  .container('example')
  .dir('dir')
  .list()
  .then(res => res.text())
```

### Delete

```ts
let res = await storage
  .container('example')
  .dir('dir')
  .file('file.txt')
  .delete()

console.log('isDeleted:': res.ok)
```


## Table Examples

Each method returns a Response object.

### Create

```ts
let res = await storage
  .table('example')
  .partition('abc') // A partition key
  .entity('def') // a row key
  .post({
    prop1: 'value' // A string or number or boolean
    prop2: 100
  })

console.log('isSucceed:': res.ok)
```

### Get

```ts
let entity = await storage
  .table('example')
  .partition('abc')
  .entity('def')
  .get()
  .then(res => res.json())
```

### List

```ts
let entities = await storage
  .table('example')
  .partition('abc')
  .list()
  .then(res => res.json())
```

### Update

```ts
let res = await storage
  .table('example')
  .partition('abc')
  .entity('def')
  .merge({
    key2: 400
  })

console.log('isSucceed:': res.ok)
```

### Create or Update

```ts
let res = await storage
  .table('example')
  .partition('abc')
  .entity('def')
  .put({
    key1: 'value'
    key2: 400
  })

console.log('isSucceed:': res.ok)
```

### Delete

```ts
let res = await storage
  .table('example')
  .partition('abc')
  .entity('def')
  .delete()

console.log('isDeleted:': res.ok)
```