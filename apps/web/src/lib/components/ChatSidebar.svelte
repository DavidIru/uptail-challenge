<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { MessageCircle, Plus, X, Loader2 } from 'lucide-svelte';
  import { chatService } from '$lib/services/chat';
  import type { ChatListItem } from '$lib/types';

  export let isOpen = false;
  export let currentChatId = '';

  const dispatch = createEventDispatcher<{ 
    selectChat: string;
    newChat: void;
    close: void;
  }>();

  let chats: ChatListItem[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(() => {
    loadChats();
  });

  $: if (isOpen && chats.length === 0 && !isLoading) {
    loadChats();
  }

  async function loadChats() {
    try {
      isLoading = true;
      error = null;
      chats = await chatService.getChats();
    } catch (e) {
      console.error('Failed to load chats:', e);
      error = 'Failed to load chat history';
      chats = [];
    } finally {
      isLoading = false;
    }
  }

  function formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  }

  function selectChat(chatId: string) {
    dispatch('selectChat', chatId);
  }

  async function newChat() {
    dispatch('newChat');
    // Reload chats after creating a new one
    await loadChats();
  }

  function closeSidebar() {
    dispatch('close');
  }

  // Expose loadChats method for parent component
  export { loadChats };
</script>

<div 
  class="fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col"
  class:-translate-x-full={!isOpen}
  class:translate-x-0={isOpen}
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-200">
    <h2 class="text-lg font-semibold text-gray-900">Conversations</h2>
    <div class="flex items-center space-x-2">
      <button
        on:click={newChat}
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        title="New conversation"
      >
        <Plus size={18} />
      </button>
      <button
        on:click={closeSidebar}
        class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors lg:hidden"
        title="Close"
      >
        <X size={18} />
      </button>
    </div>
  </div>

  <!-- Chat List -->
  <div class="flex-1 overflow-y-auto">
    {#if isLoading}
      <div class="flex items-center justify-center p-8">
        <Loader2 size={24} class="animate-spin text-gray-400" />
        <span class="ml-2 text-sm text-gray-500">Loading conversations...</span>
      </div>
    {:else if error}
      <div class="p-4 text-center">
        <p class="text-sm text-red-500 mb-2">{error}</p>
        <button
          on:click={loadChats}
          class="text-xs text-blue-500 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    {:else if chats.length === 0}
      <div class="p-4 text-center">
        <MessageCircle size={32} class="mx-auto text-gray-300 mb-2" />
        <p class="text-sm text-gray-500">No conversations yet</p>
        <p class="text-xs text-gray-400 mt-1">Start a new conversation to get started</p>
      </div>
    {:else}
      {#each chats as chat (chat.id)}
        <button
          on:click={() => selectChat(chat.id)}
          class="w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
          class:bg-message-user={currentChatId === chat.id}
          class:bg-opacity-10={currentChatId === chat.id}
          class:border-l-4={currentChatId === chat.id}
          class:border-message-user={currentChatId === chat.id}
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-2 mb-1">
                <MessageCircle size={14} class="text-gray-400 flex-shrink-0" />
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {chat.title}
                </h3>
              </div>
              <p class="text-xs text-gray-400 truncate">
                {chat.lastMessage}
              </p>
            </div>
            <span class="text-xs text-gray-400 ml-2 flex-shrink-0">
              {formatTime(chat.timestamp)}
            </span>
          </div>
        </button>
      {/each}
    {/if}
  </div>

  <!-- Footer -->
  <div class="p-4 border-t border-gray-200 bg-gray-50">
    <div class="text-xs text-gray-500 text-center">
      {#if !isLoading}
        <span class="font-medium">{chats.length}</span> conversation{chats.length !== 1 ? 's' : ''}
      {/if}
    </div>
  </div>
</div>

<!-- Overlay para móvil -->
{#if isOpen}
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
    on:click={closeSidebar}
  ></div>
{/if}

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style> 