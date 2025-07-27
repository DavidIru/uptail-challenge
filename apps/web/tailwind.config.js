/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#f7f7f8',
        'chat-dark': '#343541',
        'message-user': '#10a37f',
        'message-assistant': '#ffffff',
        'sidebar-bg': '#202123',
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
      }
    },
  },
  plugins: [],
  darkMode: 'class'
} 