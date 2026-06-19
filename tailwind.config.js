/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onyx: {
          canvas: "var(--color-onyx-canvas)",
          panel: "var(--color-onyx-panel)",
          border: "var(--color-onyx-border)",
          muted: "var(--color-onyx-muted)",
          bright: "var(--color-onyx-bright)",
          accent: {
            green: "var(--color-onyx-accent-green)",
            cyan: "var(--color-onyx-accent-cyan)",
            purple: "var(--color-onyx-accent-purple)",
            amber: "var(--color-onyx-accent-amber)",
            rose: "var(--color-onyx-accent-rose)",
          }
        },
        agent: {
          growth: "var(--color-agent-growth)",
          logistics: "var(--color-agent-logistics)",
          network: "var(--color-agent-network)",
          director: "var(--color-agent-director)",
          security: "var(--color-agent-security)",
        }
      },
      boxShadow: {
        'glow-green': '0 0 10px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.1)',
        'glow-cyan': '0 0 10px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.1)',
        'glow-purple': '0 0 10px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.1)',
        'glow-rose': '0 0 10px rgba(244, 63, 94, 0.4), 0 0 20px rgba(244, 63, 94, 0.1)',
        'border-glow': '0 0 8px rgba(39, 39, 42, 0.5)',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
