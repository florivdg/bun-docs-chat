import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments, search } from './src/vectorstore'
import { ask } from './src/chat'

const filePath = 'files/brexit.pdf'

const docs = await load(filePath)
const chunks = await split(docs)
const fileID = await addDocuments(filePath, chunks)

const searchResult = await search(
  'How many members has the settlement board?',
  10,
  (doc) => doc.metadata.file_id === fileID,
)

const relevantChunks = searchResult.map((result) => result[0].pageContent)
const answer = await ask('How many members has the settlement board?', relevantChunks)

console.log(answer)
