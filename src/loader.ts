import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'

export async function load(path: string) {
  const loader = new PDFLoader(path)
  return await loader.load()
}
