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

  post(partitionKey: string, rowkey:string, data: Record<string, string | number | boolean>) {
    return this.fetch('post', this.name, {
      PartitionKey: partitionKey,
      RowKey: rowkey,
      ...data
    })
  }

  get(partitionKey: string, rowkey:string, isFullMetadata = false) {
    return this.fetch('get', `${this.name}(PartitionKey='${partitionKey}',RowKey='${rowkey}')`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }

  list(partitionKey: string, isFullMetadata = false) {
    return this.fetch('get', `${this.name}()?$filter=PartitionKey eq '${partitionKey}'`, undefined, {
      'Accept': isFullMetadata ? 'application/json;odata=fullmetadata' : 'application/json;odata=nometadata'
    })
  }

  put(partitionKey: string, rowkey:string, data: Record<string, string | number | boolean>, eTag?: string) {
    return this.fetch('put', `${this.name}(PartitionKey='${partitionKey}',RowKey='${rowkey}')`, data, {
      'If-Match': eTag || '*'
    })
  }

  merge(partitionKey: string, rowkey:string, data: Record<string, string | number | boolean>, eTag?: string) {
    return this.fetch('merge', `${this.name}(PartitionKey='${partitionKey}',RowKey='${rowkey}')`, data, {
      'If-Match': eTag || '*'
    })
  }

  delete(partitionKey: string, rowkey:string, eTag?: string) {
    return this.fetch('delete', `${this.name}(PartitionKey='${partitionKey}',RowKey='${rowkey}')`, undefined, {
      'If-Match': eTag || '*'
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
