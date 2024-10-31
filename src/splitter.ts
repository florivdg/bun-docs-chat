import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type { Document } from 'langchain/document'

const CHUNK_SIZE = 250

/**
 * An instance of RecursiveCharacterTextSplitter configured to split text into chunks.
 *
 * @param chunkSize - The size of each chunk.
 * @param chunkOverlap - The overlap size between chunks, calculated as 20% of the chunk size.
 */
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_SIZE * 0.2,
})

export async function split(docs: Document[]) {
  return await splitter.splitDocuments(docs)
}
