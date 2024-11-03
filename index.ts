import { load } from './src/loader'
import { split } from './src/splitter'
import { addDocuments, search } from './src/vectorstore'
import { ask } from './src/chat'

// Helper function to get file path from CLI arguments
function getFilePathFromArgs(): string {
  const args = process.argv.slice(2) // Remove first two elements (node and script path)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--file') {
      const filePath = args[i + 1]
      if (!filePath) {
        throw new Error('File path is required after -f or --file flag')
      }
      return filePath
    }
  }

  throw new Error('Please provide a file path using -f or --file flag')
}

// Get and validate file path
let filePath: string
try {
  filePath = getFilePathFromArgs()
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error('An unknown error occurred')
  }
  process.exit(1)
}

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
