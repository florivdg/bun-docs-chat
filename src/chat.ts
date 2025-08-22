import { AIMessage, HumanMessage, type BaseMessage } from '@langchain/core/messages'
import { createHistoryAwareRetriever } from 'langchain/chains/history_aware_retriever'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { createRetrievalChain } from 'langchain/chains/retrieval'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatOllama } from '@langchain/ollama'
import { vectorStore, type FileId } from './vectorstore'

// Initialize Ollama chat model with specific configuration
const llm = new ChatOllama({
  model: 'llama3.2',
  temperature: 1,
  maxRetries: 2,
})

/**
 * The main chat function that interacts with the Ollama model to generate a response.
 * @param input The latest user question.
 * @param chatHistory The messages that were exchanged in the chat so far.
 * @param fileId The ID of the file to retrieve the context from.
 */
async function chat(input: string, chatHistory: BaseMessage[], fileId: FileId) {
  // Use new WhereCondition-based filter (FilterType) to constrain by file_id
  const retriever = vectorStore.asRetriever({
    k: 10,
    filter: {
      file_id: { operator: '=', value: fileId },
    },
  })

  // Define the prompt for rephrasing the user question
  const rephraseSystemPrompt = `Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question just reformulate it if needed and otherwise return it as is.`

  // Create a prompt template for rephrasing the user question
  const rephrasePrompt = ChatPromptTemplate.fromMessages([
    ['system', rephraseSystemPrompt],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ])

  // Create a history-aware retriever that uses the rephrased question
  const historyAwareRetriever = await createHistoryAwareRetriever({
    llm,
    retriever,
    rephrasePrompt,
  })

  // Define the system prompt for the main question-answering task
  const systemPrompt = `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, say that you don't know. Use three sentences maximum and keep the answer concise.\n\n{context}`

  // Create a prompt template for the question-answering task
  const qaPrompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
  ])

  // Create a chain for combining the documents
  const combineDocsChain = await createStuffDocumentsChain({
    llm,
    prompt: qaPrompt,
  })

  // Create a chain for the retrieval task
  const ragChain = await createRetrievalChain({
    retriever: historyAwareRetriever,
    combineDocsChain,
  })

  return ragChain.stream({
    input,
    chat_history: chatHistory,
  })
}

/**
 * Start the chat interaction with the user.
 * @param fileId The ID of the file containing the relevant information.
 */
export async function startChat(fileId: FileId) {
  // Initialize the chat history
  const chatHistory: BaseMessage[] = []

  // Print the initial prompt
  const prompt = '👤: '
  process.stdout.write(prompt)

  // Read line-by-line from the console
  for await (const line of console) {
    // Trim the input and remove any leading/trailing whitespace
    const input = line.trim()

    // Add the user input to the chat history
    chatHistory.push(new HumanMessage(input))

    // Call the chat function and print the assistant's response
    const chatResponse = chat(input, chatHistory, fileId)
    process.stdout.write('🤖: ')
    let answer = ''
    for await (const chunk of await chatResponse) {
      if (chunk['answer']) {
        answer += chunk.answer
        process.stdout.write(chunk.answer)
      }
    }
    process.stdout.write(`\n${prompt}`)

    // Add the assistant's response to the chat history
    chatHistory.push(new AIMessage(answer))
  }
}
