<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Send } from 'lucide-svelte';

  export let disabled = false;
  
  let message = '';
  const dispatch = createEventDispatcher<{ send: string }>();

  function handleSubmit() {
    if (message.trim() && !disabled) {
      dispatch('send', message.trim());
      message = '';
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  }
</script>

<div class="sticky bottom-0 bg-white border-t border-gray-200 p-4">
  <div class="max-w-3xl mx-auto">
    <form on:submit|preventDefault={handleSubmit} class="relative">
      <textarea
        bind:value={message}
        on:keydown={handleKeyDown}
        on:input={handleInput}
        {disabled}
        placeholder="Type your message here..."
        class="chat-input"
        rows="1"
        style="height: auto; min-height: 56px; max-height: 200px;"
      ></textarea>
      
      <button
        type="submit"
        {disabled}
        class="send-button"
        class:opacity-50={disabled || !message.trim()}
        class:cursor-not-allowed={disabled}
      >
        <Send size={20} />
      </button>
    </form>
    
    <div class="mt-2 text-xs text-gray-500 text-center">
      Press Enter to send, Shift+Enter for new line
    </div>
  </div>
</div> 