import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

/**
 * Loads a PDF document from the specified file path.
 *
 * @param path - The file path to the PDF document.
 * @returns A promise that resolves with the loaded PDF document.
 */
export async function load(path: string) {
  const loader = new PDFLoader(path)
  return await loader.load()
}
