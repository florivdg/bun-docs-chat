import type { MessageContent } from '@langchain/core/messages'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { ChatOllama } from '@langchain/ollama'

const llm = new ChatOllama({
  model: 'llama3.2',
  temperature: 1,
  maxRetries: 2,
})

export async function ask(question: string, chunks: string[]): Promise<MessageContent> {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      "Your are a specialist in answering questions based on provided documents. Try to answer the human's question, if the answer can be found on the provided documents. If you cannot answer, say that you don't know.\n\n### DOCUMENTS: {documents}",
    ],
    ['human', '{question}'],
  ])

  const chain = prompt.pipe(llm)
  const outcome = await chain.invoke({
    documents: chunks.join('\n\n'),
    question,
  })

  return outcome.content
}
