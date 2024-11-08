import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments } from './src/vectorstore'
import { startChat } from './src/chat'
import { parseArgs } from './src/args'

// Parse CLI arguments
const { filePath } = parseArgs()

// Load and process the document
const docs = await load(filePath)
const chunks = await split(docs)
const fileId = await addDocuments(filePath, chunks)

startChat(fileId)
