/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // CrimeGPT Dark Blue Theme
        bg: {
          base:    '#060d1a',
          surface: '#0d1826',
          card:    '#111f33',
          card2:   '#162438',
          hover:   '#1a2d45',
        },
        accent: {
          blue:    '#1a6cf6',
          cyan:    '#00d4ff',
          green:   '#00e676',
          amber:   '#ffa726',
          red:     '#ff5252',
          purple:  '#b57bee',
        },
        text: {
          primary:   '#e8f0fe',
          secondary: '#8aa3c8',
          muted:     '#506480',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.25s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'spin-fast': 'spin 0.7s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
