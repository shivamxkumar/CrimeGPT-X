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
        // CrimeGPT — premium dark SaaS theme
        bg: {
          base:    '#09090b',
          surface: '#0d0e12',
          card:    '#111827',
          card2:   '#161d2c',
          hover:   '#1c2436',
        },
        accent: {
          blue:    '#3b82f6',
          purple:  '#8b5cf6',
          cyan:    '#60a5fa',
          green:   '#22c55e',
          amber:   '#f59e0b',
          red:     '#ef4444',
        },
        text: {
          primary:   '#f3f4f6',
          secondary: '#9ca3af',
          muted:     '#6b7280',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
      },
      boxShadow: {
        soft:        '0 1px 2px rgba(0,0,0,0.4), 0 12px 32px -12px rgba(0,0,0,0.55)',
        'glow-blue':   '0 0 28px rgba(59,130,246,0.25)',
        'glow-purple': '0 0 28px rgba(139,92,246,0.25)',
      },
      backgroundImage: {
        'gradient-mesh': 'radial-gradient(ellipse 80% 50% at 20% -10%, rgba(59,130,246,0.15), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(139,92,246,0.12), transparent)',
        // Darker than the base accent tokens on purpose: this gradient sits
        // *behind white text* (buttons, chat bubbles, avatars, active tabs),
        // and #3b82f6→#8b5cf6 dipped under 4.5:1 contrast at the purple end.
        // #2563eb→#7c3aed keeps the brand hue but stays >=5:1 across the ramp.
        'gradient-brand': 'linear-gradient(135deg, #2563eb, #7c3aed)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.25s ease forwards',
        'fade-in': 'fadeIn 0.2s ease forwards',
        'spin-fast': 'spin 0.7s linear infinite',
        'scale-in': 'scaleIn 0.15s ease forwards',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
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
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
