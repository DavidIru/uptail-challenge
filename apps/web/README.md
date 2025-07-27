# Health Assistant - Frontend

Conversational frontend built with SvelteKit to interact with the health professionals API.

## Features

- 💬 ChatGPT-like conversational interface
- 🗂️ Collapsible chat history sidebar with conversation list
- 🐛 Debug panel with real-time facts, guidelines, and system information
- 🎨 Modern design with Tailwind CSS
- 📱 Fully responsive with mobile overlays
- ✨ Smooth animations and transitions
- 🔄 Intuitive loading states
- 🎯 TypeScript for better development experience

## Technologies Used

- **SvelteKit** - Modern web framework
- **TypeScript** - Static typing
- **Tailwind CSS** - CSS utilities
- **Lucide Svelte** - Modern icons

## Installation

```bash
# Install dependencies
pnpm install

# Development mode
pnpm dev

# Build for production
pnpm build

# Production preview
pnpm preview
```

## Configuration

The application connects by default to the API at `http://localhost:3001`. 

To change the API URL, modify `API_BASE_URL` in `src/lib/services/chat.ts`.

## Project Structure

```
src/
├── routes/              # SvelteKit pages
├── lib/
│   ├── components/      # Reusable components
│   │   ├── ChatSidebar.svelte    # Left sidebar with chat list
│   │   ├── DebugPanel.svelte     # Right sidebar with debug info
│   │   ├── ChatMessage.svelte    # Individual message component
│   │   ├── ChatInput.svelte      # Message input component
│   │   └── TypingIndicator.svelte # Typing animation
│   ├── services/        # API services
│   └── types.ts         # Shared TypeScript types
├── app.html            # Base HTML template
└── app.css             # Global styles
```

## Usage

1. Make sure the API is running on port 3001
2. Start the application with `pnpm dev`
3. Open http://localhost:3000
4. Start chatting with the assistant!

## Interface Features

### Chat Interface
- **Persistent messages**: Messages are maintained during the session
- **Auto-scroll**: Automatically scrolls to new messages
- **Typing indicator**: Shows when the assistant is responding
- **Error handling**: Informative messages when something goes wrong

### Chat Sidebar (Left)
- **Conversation list**: Browse previous conversations
- **Mock conversations**: Sample conversations for demonstration
- **Time stamps**: Relative time indicators (30m, 2h, 1d)
- **New conversation**: Button to start fresh
- **Mobile responsive**: Overlay on mobile devices

### Debug Panel (Right)
- **System status**: Connection status and chat ID
- **Facts**: Current conversation facts in JSON format
- **Active guidelines**: List of currently applied guidelines
- **Response metrics**: Latency, tokens, timestamps
- **Retrieved information**: Extracted user information
- **Collapsible sections**: Hide/show different information types
- **Dark theme**: Terminal-style appearance

### Controls
- **☰ (Menu)**: Toggle chat sidebar
- **🐛 (Bug)**: Toggle debug panel
- **❌ (X)**: New conversation (mobile)
- **Responsive design**: Adapts to screen size

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift+Enter**: New line
- **ESC**: Close sidebars (when focused) 