/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // AI Chat Widget specific styles
      colors: {
        'ai-primary': '#3B82F6',
        'ai-secondary': '#10B981',
        'ai-danger': '#EF4444',
        'ai-warning': '#F59E0B',
        'ai-success': '#10B981',
        'ai-info': '#3B82F6',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Chat widget specific spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Chat widget z-index layers
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      // Chat widget shadows
      boxShadow: {
        'chat': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'chat-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      // Typography for chat messages
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
      },
      // Chat widget border radius
      borderRadius: {
        'chat': '0.75rem',
        'message': '1rem',
      },
      // Maximum widths for chat components
      maxWidth: {
        'chat': '24rem',
        'message': '20rem',
      },
      // Minimum heights for chat components
      minHeight: {
        'chat': '32rem',
        'message-input': '2.5rem',
      },
    },
  },
  plugins: [
    // Plugin for chat-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.chat-message-user': {
          backgroundColor: theme('colors.ai-primary'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.message'),
          padding: theme('spacing.3'),
          marginLeft: theme('spacing.4'),
          maxWidth: theme('maxWidth.message'),
          wordWrap: 'break-word',
        },
        '.chat-message-assistant': {
          backgroundColor: theme('colors.gray.100'),
          color: theme('colors.gray.800'),
          borderRadius: theme('borderRadius.message'),
          padding: theme('spacing.3'),
          marginRight: theme('spacing.4'),
          maxWidth: theme('maxWidth.message'),
          wordWrap: 'break-word',
        },
        '.chat-widget': {
          position: 'fixed',
          bottom: theme('spacing.4'),
          right: theme('spacing.4'),
          width: theme('maxWidth.chat'),
          height: theme('minHeight.chat'),
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.chat'),
          boxShadow: theme('boxShadow.chat-lg'),
          zIndex: theme('zIndex.50'),
          display: 'flex',
          flexDirection: 'column',
        },
        '.mechanic-widget': {
          position: 'fixed',
          bottom: theme('spacing.4'),
          left: theme('spacing.4'),
          width: '32rem',
          height: '37.5rem',
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.chat'),
          boxShadow: theme('boxShadow.chat-lg'),
          zIndex: theme('zIndex.50'),
          display: 'flex',
          flexDirection: 'column',
        },
        '.safety-alert-danger': {
          backgroundColor: theme('colors.red.100'),
          color: theme('colors.red.800'),
          borderColor: theme('colors.red.200'),
          borderWidth: '1px',
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.2'),
          fontSize: theme('fontSize.xs[0]'),
        },
        '.safety-alert-warning': {
          backgroundColor: theme('colors.yellow.100'),
          color: theme('colors.yellow.800'),
          borderColor: theme('colors.yellow.200'),
          borderWidth: '1px',
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.2'),
          fontSize: theme('fontSize.xs[0]'),
        },
        '.safety-alert-info': {
          backgroundColor: theme('colors.blue.100'),
          color: theme('colors.blue.800'),
          borderColor: theme('colors.blue.200'),
          borderWidth: '1px',
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.2'),
          fontSize: theme('fontSize.xs[0]'),
        },
        '.typing-indicator': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.1'),
        },
        '.typing-dot': {
          width: theme('spacing.2'),
          height: theme('spacing.2'),
          backgroundColor: theme('colors.gray.400'),
          borderRadius: '50%',
          animation: 'bounce 1.4s infinite ease-in-out',
        },
        '.typing-dot:nth-child(1)': {
          animationDelay: '-0.32s',
        },
        '.typing-dot:nth-child(2)': {
          animationDelay: '-0.16s',
        },
      };

      addUtilities(newUtilities);
    },
    // Plugin for responsive chat widgets
    function({ addComponents, theme }) {
      const components = {
        '.chat-responsive': {
          '@media (max-width: 640px)': {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            borderRadius: '0',
            maxWidth: 'none',
            minHeight: '100vh',
          },
        },
        '.chat-button': {
          backgroundColor: theme('colors.ai-primary'),
          color: theme('colors.white'),
          borderRadius: '50%',
          width: theme('spacing.16'),
          height: theme('spacing.16'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme('boxShadow.lg'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.blue.700'),
            transform: 'scale(1.05)',
          },
        },
        '.mechanic-button': {
          backgroundColor: theme('colors.ai-secondary'),
          color: theme('colors.white'),
          borderRadius: '50%',
          width: theme('spacing.16'),
          height: theme('spacing.16'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme('boxShadow.lg'),
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.green.700'),
            transform: 'scale(1.05)',
          },
        },
      };

      addComponents(components);
    },
  ],
};