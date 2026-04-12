import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0a0a0a',
        panel: '#111111',
        border: '#222222',
        accent: '#7c5cfc',
        'accent-hover': '#6a4be8',
        muted: '#444444',
        surface: '#1a1a1a',
      },
    },
  },
  plugins: [],
};
export default config;
