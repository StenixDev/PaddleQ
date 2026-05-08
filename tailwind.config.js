export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        court: {
          50: '#eefaf4',
          500: '#2fb77d',
          700: '#147254'
        }
      }
    }
  },
  plugins: []
};
