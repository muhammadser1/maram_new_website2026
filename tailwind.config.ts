import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // معهد المرام – teal & amber
        brand: '#0D9488',       // teal-600 primary
        'brand-accent': '#B45309', // amber-700 accent
        'brand-teal': '#0D9488',
        'brand-amber': '#B45309',
      },
    },
  },
  plugins: [],
}
export default config

