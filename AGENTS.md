# Repository Guidelines

## Project Structure & Module Organization
- `index.ts`: CLI entrypoint; orchestrates load → split → index → chat.
- `src/`: TypeScript modules
  - `args.ts` (CLI flags), `loader.ts` (PDF loader), `splitter.ts` (chunking),
    `vectorstore.ts` (LibSQL + embeddings), `chat.ts` (Ollama RAG chat).
- `files/`: Local PDFs (gitignored). Example: `files/brexit.pdf`.
- `vector-store.db`: Local LibSQL database (gitignored).
- Config: `.prettierrc`, `tsconfig.json`, `bun.lock`.

## Build, Test, and Development Commands
- Install deps: `bun install`
- Pull models (match code defaults):
  - Chat: `ollama pull qwen3`
  - Embeddings: `ollama pull dengcao/Qwen3-Embedding-0.6B:Q8_0`
- Run locally: `bun run index.ts -f files/brexit.pdf`
- Format check: `bunx prettier --check .`
- Format write: `bunx prettier --write .`

## Coding Style & Naming Conventions
- Language: TypeScript (ESM). Strict mode on.
- Formatting: Prettier – 2 spaces, single quotes, no semicolons, trailing commas, width 120.
- Files: lowercase module names (e.g., `vectorstore.ts`, `loader.ts`).
- Exports: prefer named exports; camelCase for functions/vars; PascalCase for types.
- Keep modules focused (one responsibility) and avoid side effects in `src/*` except explicit init in `vectorstore.ts`.

## Testing Guidelines
- No tests exist yet. If adding tests, use Bun’s test runner.
- Location: `src/**/*.test.ts`.
- Run: `bun test`.
- Aim for fast unit tests around `loader`, `splitter`, and retrieval filtering.

## Commit & Pull Request Guidelines
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:` with optional scope (e.g., `feat(vectorstore): …`).
- PRs: concise description, reasoning, and manual run steps. Include sample command and models used. Link issues when applicable.
- Keep diffs small and focused. Update README if changing default models or CLI flags.

## Security & Configuration Tips
- Do not commit large PDFs or `vector-store.db` (already in `.gitignore`).
- Models are set in `src/chat.ts` and `src/vectorstore.ts`. If you change defaults, note required `ollama pull` commands.
- Data stays local; verify paths you pass via `-f` are safe and readable.
