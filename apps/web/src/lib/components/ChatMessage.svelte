<script lang="ts">
  import type { ChatMessage } from '$lib/types';
  import { User, Bot } from 'lucide-svelte';

  export let message: ChatMessage;

  $: isUser = message.role === 'user';
  $: formattedTime = message.timestamp.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
</script>

<div class="chat-message" class:user-message={isUser} class:assistant-message={!isUser}>
  <div class="message-content">
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" 
             class:bg-message-user={isUser} 
             class:bg-gray-500={!isUser}
             class:text-white={true}>
          {#if isUser}
            <User size={16} />
          {:else}
            <Bot size={16} />
          {/if}
        </div>
      </div>
      
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-1">
          <span class="text-sm font-medium text-gray-900">
            {isUser ? 'You' : 'Health Assistant'}
          </span>
          <span class="text-xs text-gray-500">{formattedTime}</span>
        </div>
        
        <div class="prose prose-sm max-w-none text-gray-800">
          {@html message.content.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
  </div>
</div> 