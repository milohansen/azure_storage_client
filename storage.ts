import { encode, decode } from "https://deno.land/std@0.158.0/encoding/base64.ts"

import { Container } from './container.ts'
import { Table } from './table.ts'

/**
 * Azure Storage Client
 *
 * @remarks
 *
 * REST API Guide: {@link https://docs.microsoft.com/en-US/rest/api/storageservices/}
 */
export class AzureStorage {
  #connectionString: string
  #accountName?: string
  #endpointSuffix?: string
  #key?: CryptoKey
  #containers: Map<string, Container>
  #tables: Map<string, Table>

  get accountName() {
    return this.#accountName
  }
  get endpointSuffix() {
    return this.#endpointSuffix
  }
  constructor(connectionString: string) {
    this.#containers = new Map()
    this.#tables = new Map()
    this.#connectionString = connectionString
  }

  async initialize(): Promise<void> {
    if (!this.#key) {
      let keyValues = this.#connectionString.split(';')
      for(let keyValue of keyValues) {
        let [key, ...values] = keyValue.split('=')
        let value = values.join('=')
        if (key === 'AccountName') {
          this.#accountName = value
        }
        if (key === 'AccountKey') {
          this.#key = await crypto.subtle.importKey(
            'raw',
            decode(value),
            { name: 'HMAC', hash: 'SHA-256' },
            true,
            ['sign', 'verify'],
          )
        }
        if (key === 'EndpointSuffix') {
          this.#endpointSuffix = value
        }
      }
    }
  }

  container(name: string): Container {
    if (!this.#containers.has(name)) {
      this.#containers.set(name, new Container(this, name))
    }
    return this.#containers.get(name) as Container
  }

  table(name: string): Table {
    if (!this.#tables.has(name)) {
      this.#tables.set(name, new Table(this, name))
    }
    return this.#tables.get(name) as Table
  }

  async createAuthorization(
    method: string,
    url: string,
    headers: Record<string, string>,
    isTable = false
  ) {
    await this.initialize()
    let [pathname, search] = url.split('?')
    let query = new URLSearchParams(search || '')

    // https://docs.microsoft.com/en-US/rest/api/storageservices/authorize-with-shared-key#constructing-the-canonicalized-resource-string
    let canonicalizedHeaders =
      Object.entries(headers)
        .filter(entry => entry[0].startsWith('x-ms-'))
        .map(entry => `${entry[0].toLowerCase()}:${entry[1]}`)
        .sort((a, b) => a < b ? -1 : 1)
        .join('\n') + '\n'

     // https://learn.microsoft.com/en-US/rest/api/storageservices/authorize-with-shared-key#shared-key-format-for-2009-09-19-and-later
    let pureQueries = [...query.entries()].filter(entry => !entry[0].startsWith('$'))
    let canonicalizedResource =
      `/${this.#accountName}/${encodeURI(pathname)}` +
      (
        pureQueries.length ?
          '\n' +  pureQueries
            .map(entry => `${entry[0].toLowerCase()}:${entry[1].replaceAll(' ', '%20')}`)
            .sort((a, b) => a < b ? -1 : 1)
            .join('\n') :
          ''
      )

    let text = (!isTable ?
      [
        method.toUpperCase(),
        headers['Content-Encoding'] || '',
        headers['Content-Language'] || '',
        headers['Content-Length'] === '0' ? '' : headers['Content-Length'] || '',
        headers['Content-MD5'] || '',
        headers['Content-Type'] || '',
        '', // Date
        headers['If-Modified-Since'] || '',
        headers['If-Match'] || '',
        headers['If-None-Match'] || '',
        headers['If-Unmodified-Since'] || '',
        headers['Range'] || '',
        canonicalizedHeaders + canonicalizedResource
      ] :
      [
        method.toUpperCase(),
        headers['Content-MD5'] || '',
        headers['Content-Type'] || '',
        headers['x-ms-date'] || '',
        canonicalizedResource
      ]).join('\n')

    let signature = encode(await crypto.subtle.sign(
      'HMAC',
      this.#key as CryptoKey,
      new TextEncoder().encode(text)
    ))
    return `SharedKey ${this.#accountName}:${signature}`
  }

}
