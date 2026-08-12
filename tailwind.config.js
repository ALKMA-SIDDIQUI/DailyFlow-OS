/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vibe: {
          bg: '#07080f',
          surface: '#0d101d',
          surfaceHover: '#13182b',
          card: 'rgba(13, 16, 29, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          borderGlow: 'rgba(0, 242, 254, 0.25)',
          cyan: '#00f2fe',
          cyanGlow: '#00f2fe',
          purple: '#8b5cf6',
          purpleGlow: '#7000ff',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          textMuted: '#94a3b8',
          textSubtle: '#64748b'
        }
      },
      backgroundImage: {
        'vibe-gradient': 'linear-gradient(135deg, rgba(0, 242, 254, 0.15) 0%, rgba(121, 40, 202, 0.15) 100%)',
        'vibe-card-gradient': 'linear-gradient(180deg, rgba(20, 26, 43, 0.8) 0%, rgba(11, 14, 25, 0.9) 100%)',
        'cyan-purple': 'linear-gradient(135deg, #00f2fe 0%, #7928ca 100%)',
        'emerald-cyan': 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
        'rose-amber': 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
      },
      boxShadow: {
        'vibe-glow': '0 0 25px -5px rgba(0, 242, 254, 0.25)',
        'purple-glow': '0 0 25px -5px rgba(123, 44, 191, 0.3)',
        'rose-glow': '0 0 25px -5px rgba(244, 63, 94, 0.3)',
        'emerald-glow': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
