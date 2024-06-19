# azure_storage_client

A simple client for Azure Storage and Key Vault REST API.

This client works query builder chaining. Each methods returns a Response object of the Fetch API.

## Usage

You need the connection string for your Azure storage account.
It has at least three fields:

- AccountName=*****;
- AccountKey=*****;
- EndpointSuffix=*****;

It's easy to get from the Azure portal.


```ts
import { AzureStorage } from "https://deno.land/x/azure_storage_client@0.8.1/mod.ts"

let storage = new AzureStorage(/* The connection string here */)
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

console.log('Succeed:': res.ok)
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
let res = await entity.post(
  {
    prop1: 'value' // A string or number or boolean
    prop2: 100
  }
)

console.log('Succeed:': res.ok)
```

### Get

```ts
let data = await entity.get().then(res => res.json())
```

### Update

```ts
let res = await entity.merge(
  {
    key2: 400
  }
)

console.log('Succeed:': res.ok)
```

### Create or Update

```ts
let res = await entity.put(
  {
    key1: 'value'
    key2: 400
  }
)

console.log('Succeed:': res.ok)
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

### Filter

```ts
let entities = await storage
  .table('example')
  .partition('abc') // Optional
  .filter(`Timestamp ge datetime'2023-01-01T00:00:00.000Z'`)
  .list()
  .then(res => res.json())
```

## Queue Examples

### Put

```ts
let res = await storage.queue('queueName').put('message')
```

### Dequeue

```ts
let xml = await storage.queue('queueName').get().then(res => res.text())
let data = parse(xml) // require parse xml (https://deno.land/x/xml)

if (data.QueueMessagesList) {
  let { MessageText, MessageId, PopReceipt } = data.QueueMessagesList.QueueMessage
  console.log('message:', MessageText)
  await storage.queue('queueName').message(MessageId, PopReceipt).delete()
} else {
  console.log('The queue is empty')
}
```

### Visibility Timeout

```ts
let xml = await storage.queue('queueName').get(10).then(res => res.text()) // 10 sec
let data = parse(xml) // require parse xml (https://deno.land/x/xml)

if (data.QueueMessagesList) {
  let { MessageText, MessageId, PopReceipt } = data.QueueMessagesList.QueueMessage
  console.log('message:', MessageText)
  await storage.queue('queueName').message(MessageId, PopReceipt).update(30) // 30 sec
} else {
  console.log('The queue is empty')
}
```

### Clear

```ts
let res = await storage.queue('queueName').clear()
```

### Peek

```ts
let xml = await storage.queue('queueName').peek(10).then(res => res.text()) // 10 messages
```

## Key Vault

In advance, please create an Azure AD application in the Azure portal so that it can access the kay vault


```ts
import { AzureADApplication } from 'https://deno.land/x/azure_storage_client@0.8.1/mod.ts'

let vault = new AzureADApplication(
  {
    tenantId: '****',
    clientId: '****',
    clientSecret: '****'
  }
).vault('****') // A kay vault resource name
```

## Secret Examples

### Get

```ts
let response = await key.get() // Response
let result = await key.getJson() // SecretResult object
let webKey = await key.getValue() // string value
```

## Key Examples

### Identify the key

```ts
let key = await vault
  .key('example')
  .version('***') // A version(optional)
```

### Get

```ts
let response = await key.get() // Response
let result = await key.getJson() // KeyResult object
let webKey = await key.getKey() // JsonWebKey
```

### Sign

```ts
let res = await key.sign(
  '****', // A digest encoded by BASE64 URL
  'RS256' // A encryption algorithm
)

console.log('Succeed:': res.ok)
```

## Get versions


```ts
let data: KeyVersionsResult = await key.versions().then(res => res.json())
```
