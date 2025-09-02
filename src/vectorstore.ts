import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql'
import { OllamaEmbeddings } from '@langchain/ollama'
import { createClient } from '@libsql/client'
import type { Document } from 'langchain/document'

// Initializes a new instance of the OllamaEmbeddings class with the specified model.
const embeddings = new OllamaEmbeddings({ model: 'dengcao/Qwen3-Embedding-0.6B:Q8_0' })

// Creates a client instance for interacting with the SQLite database.
const libsqlClient = createClient({
  url: 'file:./vector-store.db',
})

// Initializes a new instance of the `LibSQLVectorStore` with the provided embeddings and configuration.
// Define the metadata shape stored alongside each chunk.
export interface ChunkMetadata {
  file_id: number
}

export const vectorStore = new LibSQLVectorStore<ChunkMetadata>(embeddings, {
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
async function initVectorStore() {
  libsqlClient.execute(
    'CREATE TABLE IF NOT EXISTS vecs (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, metadata TEXT, embeddings F32_BLOB(1024));',
  )

  libsqlClient.execute(
    "CREATE INDEX IF NOT EXISTS idx_vecs_embeddings ON vecs(libsql_vector_idx(embeddings, 'compress_neighbors=float8', 'max_neighbors=20'));",
  )

  libsqlClient.execute(
    'CREATE TABLE IF NOT EXISTS files (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, path TEXT);',
  )

  libsqlClient.execute('CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);')
}

// Initializes the vector store.
await initVectorStore()

// Defines a type alias for the file ID.
export type FileId = number

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
    return Number(files[0].id) as FileId
  }

  const { rows } = await libsqlClient.execute({
    sql: 'INSERT INTO files (filename, path) VALUES (?, ?) RETURNING id;',
    args: [fileName, filePath],
  })
  const insertedId = Number(rows[0].id)
  const docsWithMetadata = docs.map((doc) => ({ ...doc, metadata: { file_id: insertedId } }))

  // Embed and insert in batches with a simple progress bar
  const total = docsWithMetadata.length
  const batchSize = 32
  let processed = 0

  function renderProgress(done: number, all: number) {
    const width = 24
    const ratio = all === 0 ? 1 : Math.min(1, done / all)
    const filled = Math.round(width * ratio)
    const bar = '█'.repeat(filled) + '░'.repeat(width - filled)
    const pct = Math.round(ratio * 100)
    const line = `Embedding ${done}/${all} [${bar}] ${pct}%\r`
    process.stdout.write(line)
  }

  renderProgress(0, total)
  const allIds: string[] = []
  let embedMsTotal = 0
  for (let i = 0; i < total; i += batchSize) {
    const batchDocs = docsWithMetadata.slice(i, i + batchSize)
    const texts = batchDocs.map((d) => d.pageContent)
    const t0 = performance.now()
    const vectors = await embeddings.embedDocuments(texts)
    embedMsTotal += performance.now() - t0
    // Insert vectors with their docs
    const ids = await vectorStore.addVectors(vectors, batchDocs)
    allIds.push(...ids)
    processed = Math.min(total, i + batchSize)
    renderProgress(processed, total)
  }
  process.stdout.write('\n')

  console.log(`Embedding time for ${fileName}: ${(embedMsTotal / 1000).toFixed(2)}s`)
  console.log(`Added ${allIds.length} vectors for file ${fileName}`)

  return insertedId as FileId
}
