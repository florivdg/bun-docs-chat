import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql'
import { OllamaEmbeddings } from '@langchain/ollama'
import { createClient } from '@libsql/client'
import type { Document } from 'langchain/document'

const embeddings = new OllamaEmbeddings({ model: 'nomic-embed-text' })

const libsqlClient = createClient({
  url: 'file:./vector-store.db',
})

const vectorStore = new LibSQLVectorStore(embeddings, {
  db: libsqlClient,
  table: 'vecs',
  column: 'embeddings',
})

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

await initVectorStore()

export type FileId = string

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

export async function search(query: string, limit: number, filter?: ((doc: Document) => boolean) | undefined) {
  return await vectorStore.similaritySearchWithScore(query, limit, filter)
}
