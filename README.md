# Health Assistant

A very simple AI agent to **book an appointment** with a specialist from a database.

## Table of Contents

- [What it does](#what-it-does)
- [Technical summary / structure](#technical-summary--structure)
- [How to run locally](#how-to-run-locally)
- [Open questions / to complete](#open-questions--to-complete)

## What it does

- Holds a conversation with the user to **understand their health need** and suggest **suitable professionals**.
- **Books appointments** with those professionals present in the database.

## Technical summary / structure

- **Monorepo (Turborepo)**: organized to share code between apps/packages when needed.
- **Web**: SvelteKit (user interface).
- **API**: NestJS (agent logic, orchestration, and data access).
- **Guidelines**: orchestration inspired by _parlant.io_.
  - Tools are used **programmatically** (not delegated to the model) to reduce errors.
  - There’s an **action system**:
    - `reply` – respond to the user.
    - `ask` – ask to disambiguate or collect more data.
    - `tool` – execute a tool.
    - `ask_and_tool` – combine a question with a tool execution.
  - The orchestrator decides what to do at each step based on the action type.
- **Conversation state** (simplified):

  ```ts
  type ConversationState = {
    topicsDiscussed: string[];
    needsSpecified: boolean;
    solutionPresented: boolean;
    informationRetrieved: Record<string, string>;
  };
  ```

- **Database**: Supabase with the **`vector` extension** enabled to store guideline embeddings.
  - Schema SQL: `scripts/database.sql`.
  - Seed data: `scripts/guidelines_rows.sql` and `scripts/professionals_rows.sql`.
  - Before using: **generate embeddings** by starting the API and calling the **embeddings creation endpoint**.
- **Local models (Ollama)**:
  - Conversations: `qwen2.5:7b-instruct`.
  - Embeddings: `bge-m3`.

## How to run locally

### 1) Prerequisites

- **Node.js** and **pnpm** (monorepo).
- **Supabase** (project with `vector` extension).
- **Ollama** installed locally.

### 2) Install Ollama and models

**macOS**:

```bash
brew install ollama
ollama pull qwen2.5:7b-instruct
ollama pull bge-m3
```

### 3) Set up the database (Supabase)

1. In your Supabase project, enable the **`vector`** (pgvector) extension.
2. Run in the SQL editor, in this order:
   - `scripts/database.sql` (creates the schema).
   - `scripts/guidelines_rows.sql` (loads guidelines).
   - `scripts/professionals_rows.sql` (loads professionals).

### 4) Environment variables (API)

- Duplicate `example.env` in the API folder and **fill in your values**.
- Rename the file to `.env`.

### 5) Start the monorepo

From the **root** of the project:

```bash
pnpm install
pnpm dev
```

- **Web**: http://localhost:3000
- **API**: http://localhost:3001

### 6) Generate embeddings

With the API running, **call the embeddings creation endpoint** to populate the database with guideline vectors. Example `curl`:

```bash
curl --request POST \
  --url http://localhost:3001/guidelines/calculate-embeddings
```

> From here, the web and API can communicate and book appointments.
