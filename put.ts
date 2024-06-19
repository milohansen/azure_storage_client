import { AzureStorage } from "./storage.ts"
import { parse } from 'https://deno.land/x/xml@5.4.7/mod.ts'
import {
  encodeBase64,
  decodeBase64,
} from "https://deno.land/std@0.224.0/encoding/base64.ts";

let storage = new AzureStorage('DefaultEndpointsProtocol=https;AccountName=apicall;AccountKey=tEumak/mlHsMwULhRUQUjB2H4KjgX8t1L8TQ4d1UYgJikOazgscjwddhGz9TwnCK0eEkGJNsjFO8ivfkdcVE3g==;EndpointSuffix=core.windows.net')

let res = await storage.queue('first').put(encodeBase64(new TextEncoder().encode('2')))
console.log('res.ok:', res.ok)