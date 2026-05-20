export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        court: {
          50: '#effaf2',
          100: '#d8f1df',
          200: '#aee2bf',
          500: '#21a36d',
          600: '#16875b',
          700: '#0f6f4d',
          800: '#0a4f39',
          900: '#063727'
        },
        ball: {
          50: '#fcffe8',
          100: '#f7ffc0',
          300: '#e9f85b',
          400: '#d7eb21',
          500: '#b8c90f'
        },
        paddle: {
          100: '#ffe4dd',
          400: '#ff866c',
          500: '#f06348',
          700: '#bd3f2b'
        }
      }
    }
  },
  plugins: []
};
