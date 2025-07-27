# Health Assistant - API

Intelligent backend API built with NestJS that provides conversational health assistance and professional recommendations.

## Features

- 🤖 **AI-Powered Conversations** - OpenAI/Ollama integration for intelligent responses
- 🧠 **Smart Guidelines System** - Context-aware behavioral guidelines with priority-based activation
- 🔍 **Professional Search & Booking** - Find and book healthcare professionals (psychologists, coaches, nutritionists)
- 📊 **Dynamic Facts Management** - Real-time conversation state and user information tracking
- 💾 **Persistent Chat History** - Supabase database integration for conversation storage
- 🛠️ **Extensible Tools System** - Function calling capabilities for external integrations
- 🎯 **Multi-language Support** - Responds in the user's preferred language
- 🔄 **Real-time Updates** - Live conversation facts and active guidelines tracking

## Technologies Used

- **NestJS** - Enterprise-grade Node.js framework
- **OpenAI API** - Large language models for conversation processing
- **Supabase** - PostgreSQL database with real-time capabilities
- **TypeScript** - Static typing for better development experience
- **JSON Logic** - Dynamic rule evaluation for guidelines
- **Vector Similarity** - Semantic search for guidelines matching

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PNPM package manager
- Supabase account
- OpenAI API key or local Ollama setup

### Environment Configuration

1. Copy the example environment file:

```bash
cp example.env .env
```

2. Configure your environment variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
OPENAI_BASE_URL=https://api.openai.com/v1  # or http://localhost:11434/v1 for Ollama
OPENAI_API_KEY=your_openai_api_key  # or "ollama" for local setup
```

### Database Setup

The API requires several Supabase tables. Run the provided SQL scripts:

```sql
-- Run these scripts in your Supabase SQL editor
-- 1. Create base tables
\i scripts/database.sql

-- 2. Populate guidelines
\i scripts/guidelines_rows.sql

-- 3. Add professionals data
\i scripts/professionals_rows.sql
```

### Installation & Running

```bash
# Install dependencies
pnpm install

# Development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Production mode
pnpm start:prod

# Run tests
pnpm test

# Run e2e tests
pnpm test:e2e
```

The API will be available at `http://localhost:3001`.

## API Endpoints

### Chat Endpoints

#### `POST /agent`

Start or continue a conversation with the health assistant.

**Request:**

```json
{
  "message": "I need help with stress management",
  "chatId": "optional-existing-chat-id"
}
```

**Response:**

```json
{
  "chatId": "generated-or-existing-chat-id",
  "reply": "I understand you're dealing with stress. Let me help you find the right professional...",
  "activeGuidelines": [
    {
      "id": "stress-management-guide",
      "title": "Stress Management Protocol",
      "priority": 8,
      "condition": {...},
      "action": {...}
    }
  ],
  "facts": {
    "solutionPresented": false,
    "informationRetrieved": {
      "problemType": "stress",
      "professionalType": "psychology"
    },
    "usedGuidelines": ["stress-management-guide"],
    "waitingFor": "location_preference"
  }
}
```

#### `GET /chat`

Retrieve all chat conversations.

**Response:**

```json
[
  {
    "id": "chat-uuid",
    "title": "Stress Management Discussion",
    "lastMessage": "I'll help you find a psychologist in your area.",
    "timestamp": "2024-01-15T10:30:00Z",
    "preview": "User discussed stress management needs..."
  }
]
```

#### `GET /chat/:id`

Get full conversation details by chat ID.

**Response:**

```json
{
  "id": "chat-uuid",
  "summary": "User seeking stress management help, prefers online sessions",
  "facts": {
    "solutionPresented": true,
    "informationRetrieved": {
      "problemType": "stress",
      "location": "Madrid",
      "professionalId": "prof-123"
    }
  },
  "messages": [
    {
      "role": "user",
      "content": "I need help with stress"
    },
    {
      "role": "assistant",
      "content": "I can help you find a professional..."
    }
  ],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Architecture Overview

### Core Components

#### Agent Service

- **Purpose**: Main conversation orchestrator
- **Responsibilities**:
  - Process user messages
  - Apply behavioral guidelines
  - Coordinate with OpenAI API
  - Execute tools when needed
  - Update conversation facts

#### Guidelines System

- **Dynamic Rule Engine**: Uses embeddings and similarity matching
- **Priority-Based Activation**: Higher priority guidelines override lower ones
- **Context Awareness**: Activates based on conversation facts and user input
- **Conflict Resolution**: Handles guideline conflicts and overrides

#### Tools System

Available tools for function calling:

1. **`getProfessional`**

   - Search professionals by name or specialization
   - Filters by location, specialty, rating
   - Returns professional details

2. **`bookProfessional`**
   - Book sessions with professionals
   - Sends booking confirmations
   - Manages availability

#### Facts Management

Real-time tracking of:

- **User Information**: Location, preferences, problem type
- **Conversation State**: Solution status, waiting for input
- **Professional Matching**: Recommended professionals, booking status
- **Guideline History**: Applied guidelines, conflicts resolved

### Database Schema

#### Core Tables

- **`chats`**: Conversation metadata and summaries
- **`chat_messages`**: Individual messages with timestamps
- **`chat_facts`**: Conversation state and extracted information
- **`professionals`**: Healthcare professional profiles
- **`guidelines`**: Behavioral rules with embeddings
- **`products`**: Additional products/services (if applicable)

#### Key Features

- **Vector Search**: Semantic similarity for guideline matching
- **Real-time Updates**: Live conversation state synchronization
- **Audit Trail**: Complete conversation history preservation

## Configuration

### OpenAI Integration

The API supports both OpenAI API and local Ollama models:

**OpenAI API:**

```env
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-...
```

**Local Ollama:**

```env
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_API_KEY=ollama
```

### CORS Configuration

Pre-configured for frontend integration:

- **Allowed Origins**: `http://localhost:3000`, `http://127.0.0.1:3000`
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Content-Type, Authorization
- **Credentials**: Enabled

## Professional Categories

The system supports three main healthcare categories:

### 🧠 Psychology

- Stress management
- Anxiety and depression
- Relationship counseling
- Behavioral therapy

### 🏃 Coaching

- Life coaching
- Career development
- Leadership skills
- Personal growth

### 🥗 Nutrition

- Weight management
- Dietary planning
- Sports nutrition
- Health optimization

## Guidelines System Deep Dive

### How Guidelines Work

1. **Input Processing**: User message is converted to embeddings
2. **Similarity Matching**: Vector search finds relevant guidelines
3. **Condition Evaluation**: JSON Logic evaluates activation conditions
4. **Priority Resolution**: Higher priority guidelines take precedence
5. **Action Execution**: Approved guidelines trigger their actions

### Guideline Structure

```typescript
{
  id: "unique-guideline-id",
  title: "Human-readable title",
  priority: 1-10, // Higher numbers = higher priority
  condition: {...}, // JSON Logic condition
  action: {...},
  single_use: true, // Use only once per conversation
  conflicts_with: ["other-guideline-ids"],
  overrides: ["lower-priority-guidelines"]
}
```

### Example Guideline

```json
{
  "id": "recommend-psychologist",
  "title": "Recommend Psychologist for Mental Health",
  "priority": 8,
  "condition": {
    "and": [{ "==": [{ "var": "problemType" }, "mental_health"] }, { "!": { "var": "solutionPresented" } }]
  },
  "action": {
    "kind": "ask",
    "prompt": "Can you explain to me what your problem is or what do you need?",
    "storeAs": "problem"
  },
  "single_use": false
}
```

## Development

### Project Structure

```
src/
├── agent/              # Main conversation handler
├── chat/               # Chat management and persistence
├── db/                 # Database service and queries
├── guidelines/         # Guidelines system and matching
├── openai/            # OpenAI/LLM integration
├── professionals/     # Professional search and booking
├── tools/             # Function calling tools
└── main.ts           # Application bootstrap
```

### Adding New Tools

1. Define tool schema in `tools.service.ts`
2. Implement tool logic
3. Register in tools executor
4. Update TypeScript types

### Creating Guidelines

1. Define condition logic using JSON Logic
2. Set appropriate priority level
3. Add to guidelines database
4. Test with various conversation contexts

## Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

## Production Deployment

### Build Optimization

```bash
# Create production build
pnpm build

# Start production server
pnpm start:prod
```
