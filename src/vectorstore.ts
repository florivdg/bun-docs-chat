import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql'
import { OllamaEmbeddings } from '@langchain/ollama'
import { createClient } from '@libsql/client'
import type { Document } from 'langchain/document'

// Initializes a new instance of the OllamaEmbeddings class with the specified model.
const embeddings = new OllamaEmbeddings({ model: 'nomic-embed-text' })

// Creates a client instance for interacting with the SQLite database.
const libsqlClient = createClient({
  url: 'file:./vector-store.db',
})

// Initializes a new instance of the `LibSQLVectorStore` with the provided embeddings and configuration.
const vectorStore = new LibSQLVectorStore(embeddings, {
  db: libsqlClient,
  table: 'vecs',
  column: 'embeddings',
})

/**
 * Initializes the vector store by creating necessary tables and indexes if they do not already exist.
 *
 * This function performs the following operations:
 * 1. Creates a table named `vecs` with columns for id, content, metadata, and embeddings.
 * 2. Creates an index on the `embeddings` column of the `vecs` table.
 * 3. Creates a table named `files` with columns for id, filename, and path.
 * 4. Creates an index on the `filename` column of the `files` table.
 *
 * @returns A promise that resolves when the initialization is complete.
 */
export async function initVectorStore() {
  libsqlClient.execute(
    'CREATE TABLE IF NOT EXISTS vecs (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, metadata TEXT, embeddings F32_BLOB(768));',
  )

  libsqlClient.execute('CREATE INDEX IF NOT EXISTS idx_vecs_embeddings ON vecs(libsql_vector_idx(embeddings));')

  libsqlClient.execute(
    'CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, path TEXT);',
  )

  libsqlClient.execute('CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);')
}

// Initializes the vector store.
await initVectorStore()

// Defines a type alias for the file ID.
export type FileId = string

/**
 * Adds the specified documents to the vector store.
 *
 * @param filePath - The path to the file containing the documents.
 * @param docs - The documents to add to the vector store.
 * @returns A promise that resolves with the ID of the file containing the documents.
 */
export async function addDocuments(filePath: string, docs: Document[]): Promise<FileId> {
  const fileName = filePath.split('/').pop() ?? filePath

  // Check if file was already inserted
  const { rows: files } = await libsqlClient.execute({
    sql: 'SELECT id FROM files WHERE filename = ? AND path = ?;',
    args: [fileName, filePath],
  })

  if (files.length > 0) {
    console.log('File already exists with ID:', files[0].id)
    return files[0].id as FileId
  }

  const { rows } = await libsqlClient.execute({
    sql: 'INSERT INTO files (filename, path) VALUES (?, ?) RETURNING id;',
    args: [fileName, filePath],
  })
  const docsWithMetadata = docs.map((doc) => ({ ...doc, metadata: { file_id: rows[0].id } }))

  const vecsIds = await vectorStore.addDocuments(docsWithMetadata)

  console.log(`Added ${vecsIds.length} vectors for file ${fileName}`)

  return rows[0].id as FileId
}

/**
 * Searches the vector store for documents similar to the specified query.
 *
 * @param query - The query to search for.
 * @param limit - The maximum number of results to return.
 * @param filter - An optional filter function to apply to the search results.
 * @returns A promise that resolves with the search results.
 */
export async function search(query: string, limit: number, filter?: ((doc: Document) => boolean) | undefined) {
  return await vectorStore.similaritySearchWithScore(query, limit, filter)
}
