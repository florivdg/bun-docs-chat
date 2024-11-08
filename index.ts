import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments } from './src/vectorstore'
import { chat } from './src/chat'
import { parseArgs } from './src/args'

// Parse CLI arguments
const { filePath } = parseArgs()

// Load and process the document
const docs = await load(filePath)
const chunks = await split(docs)
const fileId = await addDocuments(filePath, chunks)

const answer = await chat('How many members has the settlement board?', [], fileId)

console.log(answer)
