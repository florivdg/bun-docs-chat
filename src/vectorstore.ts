import { LibSQLVectorStore } from '@langchain/community/vectorstores/libsql'
import { OllamaEmbeddings } from '@langchain/ollama'
import { createClient } from '@libsql/client'
import type { Document } from 'langchain/document'

const embeddings = new OllamaEmbeddings({ model: 'nomic-embed-text' })

const libsqlClient = createClient({
  url: 'file:../vector-store.db',
})

libsqlClient.execute(
  'CREATE TABLE IF NOT EXISTS vecs (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, metadata TEXT, embeddings F32_BLOB(768));',
)
libsqlClient.execute('CREATE INDEX IF NOT EXISTS idx_vecs_embeddings ON vecs(libsql_vector_idx(embeddings));')

const vectorStore = new LibSQLVectorStore(embeddings, {
  db: libsqlClient,
  table: 'vecs',
  column: 'embeddings',
})

export async function addDocuments(docs: Document[]) {
  return await vectorStore.addDocuments(docs)
}
