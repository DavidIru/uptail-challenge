<script lang="ts">
  import { onMount } from 'svelte';
  import ChatMessage from '$lib/components/ChatMessage.svelte';
  import TypingIndicator from '$lib/components/TypingIndicator.svelte';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import ChatSidebar from '$lib/components/ChatSidebar.svelte';
  import DebugPanel from '$lib/components/DebugPanel.svelte';
  import { chatService } from '$lib/services/chat';
  import type { ChatMessage as ChatMessageType } from '$lib/types';
  import { MessageCircle, Heart, Menu, Bug, X } from 'lucide-svelte';

  let messages: ChatMessageType[] = [];
  let isLoading = false;
  let isLoadingChat = false;
  let currentChatId = '';
  let chatContainer: HTMLElement;
  let chatSidebar: any;
  
  let chatSidebarOpen = false;
  let debugPanelOpen = false;
  
  let debugData: {
    facts: any;
    activeGuidelines: any[];
    chatId: string;
    lastResponse: any;
    connectionStatus: string;
    isHistorical: boolean;
  } = {
    facts: null,
    activeGuidelines: [],
    chatId: '',
    lastResponse: null,
    connectionStatus: 'disconnected',
    isHistorical: false
  };

  onMount(() => {
    messages = [
      {
        role: 'assistant',
        content: 'Hello! I am your health assistant. I am here to help you find the perfect professional for your needs. I can recommend psychologists, coaches or nutritionists. What can I help you with today?',
        timestamp: new Date()
      }
    ];
  });

  async function handleSendMessage(event: CustomEvent<string>) {
    const userMessage = event.detail;
    
    // Agregar mensaje del usuario
    const userChatMessage: ChatMessageType = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    messages = [...messages, userChatMessage];
    isLoading = true;
    
    setTimeout(() => scrollToBottom(), 100);
    
    try {
      // Only include chatId if we have an active chat
      const requestPayload: any = { message: userMessage };
      if (currentChatId) {
        requestPayload.chatId = currentChatId;
      }
      
      // Measure API call latency
      const startTime = performance.now();
      const response = await chatService.sendMessage(requestPayload);
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      if (!currentChatId) {
        currentChatId = response.chatId;
        debugData.chatId = response.chatId;
        debugData.connectionStatus = 'connected';
        
        if (chatSidebar?.loadChats) {
          chatSidebar.loadChats();
        }
      }
      
      const assistantMessage: ChatMessageType = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date()
      };
      
      messages = [...messages, assistantMessage];
      
      debugData.lastResponse = {
        timestamp: new Date(),
        latency: `${latency}ms`,
        response: response.reply
      };
      
      // Actualizar activeGuidelines y facts desde la respuesta
      debugData.activeGuidelines = response.activeGuidelines || [];
      debugData.facts = response.facts || null;
      debugData.isHistorical = false; // Esta es una conversación activa
      
    } catch (error) {
      console.error('Error:', error);
      
      // Mostrar mensaje de error
      const errorMessage: ChatMessageType = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please make sure the server is running and try again.',
        timestamp: new Date()
      };
      
      messages = [...messages, errorMessage];
    } finally {
      isLoading = false;
      setTimeout(() => scrollToBottom(), 100);
    }
  }

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  function clearChat() {
    messages = [
      {
        role: 'assistant',
        content: 'Hello! I am your personal health assistant. I am here to help you find the perfect professional for your needs. I can recommend psychologists, coaches or nutritionists. What can I help you with today?',
        timestamp: new Date()
      }
    ];
    currentChatId = '';
    debugData.chatId = '';
    debugData.connectionStatus = 'disconnected';
    debugData.activeGuidelines = [];
    debugData.lastResponse = null;
    debugData.facts = null;
    debugData.isHistorical = false;
  }

  function toggleChatSidebar() {
    chatSidebarOpen = !chatSidebarOpen;
  }

  function toggleDebugPanel() {
    debugPanelOpen = !debugPanelOpen;
  }

  async function handleSelectChat(event: CustomEvent<string>) {
    const chatId = event.detail;
    
    if (currentChatId === chatId) {
      chatSidebarOpen = false; 
      return;
    }
    
    try {
      isLoadingChat = true;
      currentChatId = chatId;
      
      const chatDetails = await chatService.getChatById(chatId);
      
      messages = chatDetails.messages;
      
      debugData.chatId = chatId;
      debugData.facts = chatDetails.facts;
      debugData.connectionStatus = 'connected';
      debugData.activeGuidelines = [];
      debugData.lastResponse = null;
      debugData.isHistorical = true;
      
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      const errorMessage: ChatMessageType = {
        role: 'assistant',
        content: 'Sorry, there was an error loading this conversation. Please try again.',
        timestamp: new Date()
      };
      
      messages = [errorMessage];
    } finally {
      isLoadingChat = false;
    }
  }

  function handleNewChat() {
    clearChat();
  }
</script>

<svelte:head>
  <title>Health Assistant - Find your ideal professional</title>
  <meta name="description" content="Find psychologists, coaches and nutritionists perfect for you" />
</svelte:head>

<!-- Chat Sidebar -->
<ChatSidebar 
  bind:isOpen={chatSidebarOpen}
  {currentChatId}
  on:selectChat={handleSelectChat}
  on:newChat={handleNewChat}
  on:close={() => chatSidebarOpen = false}
  bind:this={chatSidebar}
/>

<!-- Debug Panel -->
<DebugPanel 
  bind:isOpen={debugPanelOpen}
  {debugData}
  on:close={() => debugPanelOpen = false}
/>

<div 
  class="flex flex-col h-screen transition-all duration-300 ease-in-out"
  class:lg:ml-80={chatSidebarOpen}
  class:lg:mr-96={debugPanelOpen}
>
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 px-4 py-3 relative z-30">
    <div class="max-w-3xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <!-- Mobile/Desktop toggle buttons -->
        <button
          on:click={toggleChatSidebar}
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          title="Show conversations"
        >
          <Menu size={18} />
        </button>
        
        <div class="w-10 h-10 bg-message-user rounded-full flex items-center justify-center">
          <Heart class="text-white" size={20} />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-gray-900">Health Assistant</h1>
          <p class="text-sm text-gray-500 hidden sm:block">Your guide to finding health professionals</p>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          on:click={toggleDebugPanel}
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          class:text-purple-600={debugPanelOpen}
          class:bg-purple-50={debugPanelOpen}
          title="Debug panel"
        >
          <Bug size={18} />
        </button>
        
        <button
          on:click={clearChat}
          class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors hidden sm:block"
        >
          New conversation
        </button>
        
        <!-- Mobile clear chat button -->
        <button
          on:click={clearChat}
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors sm:hidden"
          title="New conversation"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  </header>

  <!-- Chat Messages -->
  <div 
    bind:this={chatContainer}
    class="flex-1 overflow-y-auto pb-4"
  >
    {#if isLoadingChat}
      <div class="flex items-center justify-center p-8">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-message-user"></div>
          <span class="text-gray-600">Loading conversation...</span>
        </div>
      </div>
    {:else}
      {#each messages as message (message.timestamp)}
        <ChatMessage {message} />
      {/each}
      
      {#if isLoading}
        <TypingIndicator />
      {/if}
    {/if}
    
    <!-- Espaciador para el input fijo -->
    <div class="h-24"></div>
  </div>

  <!-- Chat Input -->
  <ChatInput 
    on:send={handleSendMessage} 
    disabled={isLoading || isLoadingChat}
  />
</div>

<!-- Estado de conexión -->
{#if !currentChatId && messages.length > 1}
  <div class="fixed top-20 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-md text-sm">
    <MessageCircle size={16} class="inline mr-1" />
    Establishing connection...
  </div>
{/if} 