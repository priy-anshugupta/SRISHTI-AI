import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        petroleum: {
          DEFAULT: '#0D5C75',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#0D5C75',
          900: '#0C4A6E',
          950: '#082F49',
        },
        amber: {
          DEFAULT: '#D97706',
          gold: '#D97706',
        },
        wellbore: {
          DEFAULT: '#0C1518',
          light: '#132126',
          dark: '#080E10',
        },
        formation: {
          alluvium: '#65A30D',
          namsang: '#D97706',
          girujan: '#C2410C',
          tipam: '#E0A96D',
          barail: '#475569',
          basement: '#334155',
        },
        risk: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#F59E0B',
          safe: '#059669',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 5px rgba(13, 92, 117, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(13, 92, 117, 0.6)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
