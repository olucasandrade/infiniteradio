/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/design-system/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
        },
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        border: 'var(--color-border)',
        overlay: 'var(--color-overlay)',
        station: {
          weightless: 'var(--color-station-weightless)',
          'blue-notes': 'var(--color-station-blue-notes)',
          'after-hours': 'var(--color-station-after-hours)',
          'hip-hop': 'var(--color-station-hip-hop)',
          'neo-soul': 'var(--color-station-neo-soul)',
          vaporwave: 'var(--color-station-vaporwave)',
          indie: 'var(--color-station-indie)',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk Variable"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: 'var(--text-display)',
        h1: 'var(--text-h1)',
        h2: 'var(--text-h2)',
        h3: 'var(--text-h3)',
        'body-lg': 'var(--text-body-lg)',
        body: 'var(--text-body)',
        small: 'var(--text-small)',
        micro: 'var(--text-micro)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        atmospheric: 'var(--duration-atmospheric)',
      },
      boxShadow: {
        raised: 'var(--shadow-raised)',
        overlay: 'var(--shadow-overlay)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '0.9' },
        },
      },
      animation: {
        'fade-in': 'ir-fade-in var(--duration-normal) var(--ease-standard)',
        'skeleton-pulse':
          'ir-skeleton-pulse var(--duration-atmospheric) ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
