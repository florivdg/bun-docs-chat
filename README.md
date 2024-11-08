# Bun Docs Chats

Chat with PDF files locally, fully private and secure with Ollama.

## Setup

1. Install dependencies:

```bash
bun install
```

2. Start [Ollama](https://ollama.com/)

3. Pull chat and embeddings models:

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

## Usage

To run:

```bash
bun run index.ts -f files/brexit.pdf
```
