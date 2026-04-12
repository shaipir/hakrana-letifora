import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy tokens (kept for existing code)
        canvas: '#080808',
        panel: '#0f0f0f',
        border: '#1e1e1e',
        accent: '#7c5cfc',
        'accent-hover': '#6a4be8',
        muted: '#3a3a3a',
        surface: '#161616',

        // ArtRevive design tokens
        'ar-bg': '#050507',
        'ar-surface': '#0d0d12',
        'ar-panel': '#10101a',
        'ar-border': '#1c1c2e',
        'ar-border-subtle': '#151520',
        'ar-text': '#e8e8f0',
        'ar-text-muted': '#6b6b8a',
        'ar-text-dim': '#3a3a52',
        'ar-accent': '#00e5ff',        // neon cyan
        'ar-accent-hover': '#00bcd4',
        'ar-accent-glow': 'rgba(0,229,255,0.2)',
        'ar-violet': '#8b5cf6',        // restyle accent
        'ar-violet-glow': 'rgba(139,92,246,0.2)',
        'ar-neon-green': '#39ff14',
        'ar-neon-pink': '#ff2d78',
        'ar-neon-orange': '#ff6b00',
        'ar-gold': '#f0c040',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'ar-glow-cyan': '0 0 20px rgba(0,229,255,0.35)',
        'ar-glow-violet': '0 0 20px rgba(139,92,246,0.35)',
        'ar-glow-sm': '0 0 8px rgba(0,229,255,0.2)',
      },
      backgroundImage: {
        'ar-gradient': 'linear-gradient(135deg, #050507 0%, #0a0a14 100%)',
        'ar-panel-gradient': 'linear-gradient(180deg, #10101a 0%, #0d0d12 100%)',
      },
      animation: {
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'flow-right': 'flowRight 3s linear infinite',
        'electric-flicker': 'electricFlicker 0.15s linear infinite',
      },
      keyframes: {
        neonPulse: {
          '0%,100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '0.7', filter: 'brightness(1.4)' },
        },
        flowRight: {
          '0%': { strokeDashoffset: '1000' },
          '100%': { strokeDashoffset: '0' },
        },
        electricFlicker: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '75%': { opacity: '0.9' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
