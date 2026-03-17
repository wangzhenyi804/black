/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        sidebar: 'rgb(var(--sidebar) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        primary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        accent: '#8b5cf6',
      }
    },
  },
  plugins: [],
}
