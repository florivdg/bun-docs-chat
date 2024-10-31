import type { MessageContent } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOllama } from '@langchain/ollama'

// Initialize Ollama chat model with specific configuration
const llm = new ChatOllama({
  model: 'llama3.2',
  temperature: 1,
  maxRetries: 2,
})

/**
 * Queries the LLM with a question against provided document chunks
 * @param question - The user's question to answer
 * @param chunks - Array of document text chunks to search for answers
 * @returns Promise containing the LLM's response content
 */
export async function ask(question: string, chunks: string[]): Promise<MessageContent> {
  // Create prompt template with system and user messages
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      "Your are a specialist in answering questions based on provided documents. Try to answer the human's question, if the answer can be found on the provided documents. If you cannot answer, say that you don't know.\n\n### DOCUMENTS: {documents}",
    ],
    ['human', '{question}'],
  ])

  // Execute the chain by combining prompt template with LLM
  const chain = prompt.pipe(llm)
  const outcome = await chain.invoke({
    documents: chunks.join('\n\n'), // Combine document chunks with two newlines
    question,
  })

  return outcome.content
}
