import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type { Document } from 'langchain/document'

const CHUNK_SIZE = 250

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_SIZE * 0.2,
})

export async function split(docs: Document[]) {
  return await splitter.splitDocuments(docs)
}
