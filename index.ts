import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments } from './src/vectorstore'

const start = performance.now()
const docs = await load('files/example.pdf')
console.log(`Loaded ${docs.length} documents`)
const chunks = await split(docs)
console.log(`Split into ${chunks.length} chunks`)
const result = await addDocuments(chunks)
const end = performance.now()

console.log(result, end - start, 'ms')
