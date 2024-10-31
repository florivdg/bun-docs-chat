import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments, search } from './src/vectorstore'
import { ask } from './src/chat'

// Path to the PDF file to be processed
const filePath = 'files/brexit.pdf'

// Load and process the document
const docs = await load(filePath) // Load PDF into document format
const chunks = await split(docs) // Split into smaller text chunks
const fileID = await addDocuments(filePath, chunks) // Store in vector database

// Search for relevant chunks based on the question
const searchResult = await search(
  'How many members has the settlement board?',
  10, // Return top 10 most relevant chunks
  (doc) => doc.metadata.file_id === fileID, // Filter by file ID
)

// Extract text content from search results and get answer
const relevantChunks = searchResult.map((result) => result[0].pageContent)
const answer = await ask('How many members has the settlement board?', relevantChunks)

// Output the generated answer
console.log(answer)
