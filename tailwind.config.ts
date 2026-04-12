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
        canvas: '#080808',
        panel: '#0f0f0f',
        border: '#1e1e1e',
        accent: '#7c5cfc',
        'accent-hover': '#6a4be8',
        muted: '#3a3a3a',
        surface: '#161616',
      },
    },
  },
  plugins: [],
};
export default config;
