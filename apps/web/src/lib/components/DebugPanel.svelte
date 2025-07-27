<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Bug, X, Eye, EyeOff } from 'lucide-svelte';

  export let isOpen = false;
  export let debugData: {
    facts?: any;
    activeGuidelines?: any[];
    chatId?: string;
    lastResponse?: any;
    connectionStatus?: string;
    isHistorical?: boolean;
  } = {};

  const dispatch = createEventDispatcher<{ 
    close: void;
  }>();

  let collapsedSections = {
    facts: false,
    guidelines: false,
    response: true,
    system: true
  };

  function toggleSection(section: keyof typeof collapsedSections) {
    collapsedSections[section] = !collapsedSections[section];
  }

  function closeSidebar() {
    dispatch('close');
  }

  function formatJson(obj: any): string {
    if (!obj) return 'null';
    return JSON.stringify(obj, null, 2);
  }

  // Use real data when available, fallback to mock data for demonstration
  $: displayFacts = debugData.facts || {};

  $: displayGuidelines = debugData.activeGuidelines && debugData.activeGuidelines.length > 0 
    ? debugData.activeGuidelines 
    : [];
</script>

<div 
  class="fixed inset-y-0 right-0 z-50 w-96 bg-gray-900 text-gray-100 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
  class:translate-x-full={!isOpen}
  class:translate-x-0={isOpen}
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
    <div class="flex items-center space-x-2">
      <Bug size={18} class="text-green-400" />
      <h2 class="text-lg font-semibold">Debug Panel</h2>
    </div>
    <button
      on:click={closeSidebar}
      class="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors lg:hidden"
      title="Close"
    >
      <X size={18} />
    </button>
  </div>

  <!-- Debug Content -->
  <div class="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
    
    <!-- Connection Status -->
    <div class="bg-gray-800 rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-medium text-green-400">System</h3>
        <button on:click={() => toggleSection('system')} class="text-gray-400 hover:text-gray-200">
          {#if collapsedSections.system}
            <Eye size={14} />
          {:else}
            <EyeOff size={14} />
          {/if}
        </button>
      </div>
      {#if !collapsedSections.system}
        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-400">Status:</span>
            <span class="text-green-400">● {debugData.isHistorical ? 'Historical' : 'Connected'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Chat ID:</span>
            <span class="text-blue-400 font-mono">{debugData.chatId || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">API:</span>
            <span class="text-yellow-400">localhost:3001</span>
          </div>
        </div>
      {/if}
    </div>

    <!-- Facts -->
    <div class="bg-gray-800 rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-medium text-blue-400">Facts</h3>
        <div class="flex items-center space-x-2">
          {#if debugData.isHistorical}
            <span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
              Historical
            </span>
          {/if}
          <button on:click={() => toggleSection('facts')} class="text-gray-400 hover:text-gray-200">
            {#if collapsedSections.facts}
              <Eye size={14} />
            {:else}
              <EyeOff size={14} />
            {/if}
          </button>
        </div>
      </div>
      {#if !collapsedSections.facts}
        <pre class="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto whitespace-pre-wrap">{formatJson(displayFacts)}</pre>
      {/if}
    </div>

    <!-- Active Guidelines -->
    <div class="bg-gray-800 rounded-lg p-3">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-medium text-purple-400">
          {debugData.isHistorical ? 'Guidelines' : 'Active Guidelines'}
        </h3>
        <div class="flex items-center space-x-2">
          {#if debugData.isHistorical}
            <span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
              Historical
            </span>
          {:else}
            <span class="text-xs bg-purple-600 text-white px-2 py-1 rounded">
              {displayGuidelines.length}
            </span>
          {/if}
          <button on:click={() => toggleSection('guidelines')} class="text-gray-400 hover:text-gray-200">
            {#if collapsedSections.guidelines}
              <Eye size={14} />
            {:else}
              <EyeOff size={14} />
            {/if}
          </button>
        </div>
      </div>
      {#if !collapsedSections.guidelines}
        {#if debugData.isHistorical}
          <div class="text-xs text-gray-400 p-2 text-center">
            <p>Guidelines are only shown for active conversations.</p>
            <p class="mt-1 text-gray-500">Send a new message to see active guidelines.</p>
          </div>
        {:else}
          <div class="space-y-2">
            {#each displayGuidelines as guideline}
              <div class="bg-gray-900 p-2 rounded text-xs">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-purple-300 font-medium">{guideline.title}</span>
                  <span class="text-gray-400">P:{guideline.priority}</span>
                </div>
                <div class="text-gray-400 text-xs truncate">
                  ID: {guideline.id}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Last Response -->
    {#if !debugData.isHistorical}
      <div class="bg-gray-800 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-orange-400">Last Response</h3>
          <button on:click={() => toggleSection('response')} class="text-gray-400 hover:text-gray-200">
            {#if collapsedSections.response}
              <Eye size={14} />
            {:else}
              <EyeOff size={14} />
            {/if}
          </button>
        </div>
        {#if !collapsedSections.response}
          <div class="text-xs space-y-2">
            <div>
              <span class="text-gray-400">Timestamp:</span>
              <span class="text-orange-300">{debugData.lastResponse?.timestamp?.toLocaleTimeString() || 'N/A'}</span>
            </div>
            <div>
              <span class="text-gray-400">Latency:</span>
              <span class="text-green-400">{debugData.lastResponse?.latency || 'N/A'}</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Information Retrieved -->
    {#if displayFacts.informationRetrieved && Object.keys(displayFacts.informationRetrieved).length > 0}
      <div class="bg-gray-800 rounded-lg p-3">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-medium text-cyan-400">Retrieved Information</h3>
          {#if debugData.isHistorical}
            <span class="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
              Historical
            </span>
          {/if}
        </div>
        <div class="space-y-1 text-xs">
          {#each Object.entries(displayFacts.informationRetrieved) as [key, value]}
            <div class="flex justify-between">
              <span class="text-gray-400">{key}:</span>
              <span class="text-cyan-300">{value}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  </div>

  <!-- Footer -->
  <div class="p-4 border-t border-gray-700 bg-gray-800">
    <div class="text-xs text-gray-400 text-center">
      {debugData.isHistorical ? 'Historical Debug Mode' : 'Live Debug Mode'}
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