<script lang="ts">
  import { Bot } from 'lucide-svelte';
</script>

<div class="chat-message assistant-message">
  <div class="message-content">
    <div class="flex items-start space-x-4">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 rounded-full bg-gray-500 text-white flex items-center justify-center">
          <Bot size={16} />
        </div>
      </div>
      
      <div class="flex-1 min-w-0">
        <div class="flex items-center space-x-2 mb-1">
          <span class="text-sm font-medium text-gray-900">Health Assistant</span>
        </div>
        
        <div class="flex items-center space-x-2">
          <span class="text-gray-600 text-sm">Typing</span>
          <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> 