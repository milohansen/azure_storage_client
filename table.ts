import { AzureStorage } from './storage.ts'

export class Table {
  #storage: AzureStorage
  #name: string

  get storage() {
    return this.#storage
  }
  get name() {
    return this.#name
  }

  constructor(storage: AzureStorage, name: string) {
    this.#storage = storage
    this.#name = name
  }

  partition(partitionKey: string): TablePartition {
    return new TablePartition(this, partitionKey)
  }

  filter(condition: string) {
    return new FilteredTable(this, [condition])
  }

  list(isFullMetadata = false) {
    return this.fetch('get', `${this.#name}()`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }

  async fetch(
    method: string,
    url: string,
    data?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<Response> {
    let date = new Date().toUTCString()

    let requestHeaders: Record<string, string> = {
      'Accept': 'application/json;odata=nometadata',
      'x-ms-date': date,
      'x-ms-version': '2021-04-10',
      DataServiceVersion: '3.0;NetFx',
      MaxDataServiceVersion: '3.0;NetFx'
    }
    let option: RequestInit = { method }

    if (
      method.toLowerCase() === 'post' ||
      method.toLowerCase() === 'put' ||
      method.toLowerCase() === 'merge'
    ) {
      option.body = JSON.stringify(data)
      let blob = new Blob([option.body], {type: 'text/plain'});
      requestHeaders['Content-Type'] = 'application/json'
      requestHeaders['Content-Length'] = blob.size.toString()
    }
    if (headers) {
      for (let headerName in headers) {
        requestHeaders[headerName] = headers[headerName]
      }
    }

    requestHeaders.Authorization = await this.#storage.createAuthorization(method, url, requestHeaders, true)

    option.headers = requestHeaders

    return fetch(
      `https://${this.#storage.accountName}.table.${this.#storage.endpointSuffix}/${url}`,
      option
    )
  }
}

export class FilteredTable {
  #table: Table
  #conditions: string[]

  constructor(table: Table, conditions: string[]) {
    this.#table = table
    this.#conditions = conditions
  }

  get table() {
    return this.#table
  }

  filter(condition: string) {
    return new FilteredTable(this.#table, [...this.#conditions, condition])
  }

  list(isFullMetadata = false) {
    return this.table.fetch('get', `${this.table.name}()${this.#conditions.length ? `?$filter=${this.#conditions.join(' and ')}` : ''}`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }
}

export class TablePartition {
  #table: Table
  #partitionKey: string

  constructor(table: Table, partitionKey: string) {
    this.#table = table
    this.#partitionKey = partitionKey
  }

  get table() {
    return this.#table
  }

  get partitionKey() {
    return this.#partitionKey
  }

  entity(rowKey: string): TableEntity {
    return new TableEntity(this, rowKey)
  }

  filter(condition: string) {
    return new FilteredTablePartition(this, [condition])
  }

  list(isFullMetadata = false) {
    return this.table.fetch('get', `${this.#table.name}()?$filter=PartitionKey eq '${this.#partitionKey}'`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }
}

export class FilteredTablePartition {
  #partition: TablePartition
  #conditions: string[]

  get table() {
    return this.#partition.table
  }

  get partition() {
    return this.#partition
  }

  constructor(partition: TablePartition, conditions: string[]) {
    this.#partition = partition
    this.#conditions = conditions
  }

  filter(condition: string) {
    return new FilteredTablePartition(this.#partition, [...this.#conditions, condition])
  }

  list(isFullMetadata = false) {
    return this.table.fetch('get', `${this.table.name}()?$filter=PartitionKey eq '${this.#partition.partitionKey}'${this.#conditions.length ? `and (${this.#conditions.join(' and ')})` : ''}`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }
}

export class TableEntity {
  #partition: TablePartition
  #rowKey: string

  constructor(partition: TablePartition, rowKey: string) {
    this.#partition = partition
    this.#rowKey = rowKey
  }

  get table() {
    return this.#partition.table
  }

  get partition() {
    return this.#partition
  }

  get rowKey() {
    return this.#rowKey
  }


  post(data: Record<string, string | number | boolean>) {
    return this.table.fetch('post', this.table.name, {
      PartitionKey: this.partition.partitionKey,
      RowKey: this.#rowKey,
      ...data
    })
  }

  get(isFullMetadata = false) {
    return this.table.fetch('get', `${this.table.name}(PartitionKey='${this.partition.partitionKey}',RowKey='${this.#rowKey}')`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }

  put(data: Record<string, string | number | boolean>, eTag?: string) {
    return this.table.fetch('put', `${this.table.name}(PartitionKey='${this.partition.partitionKey}',RowKey='${this.#rowKey}')`, data, {
      'If-Match': eTag || '*'
    })
  }

  merge(data: Record<string, string | number | boolean>, eTag?: string) {
    return this.table.fetch('merge', `${this.table.name}(PartitionKey='${this.partition.partitionKey}',RowKey='${this.#rowKey}')`, data, {
      'If-Match': eTag || '*'
    })
  }

  delete(eTag?: string) {
    return this.table.fetch('delete', `${this.table.name}(PartitionKey='${this.partition.partitionKey}',RowKey='${this.#rowKey}')`, undefined, {
      'If-Match': eTag || '*'
    })
  }
}