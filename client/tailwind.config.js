/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Georgia', 'serif'], body: ['Inter', 'ui-sans-serif', 'system-ui'] },
      colors: { cream: '#F8F5F0', ink: '#25211E', clay: '#B86143', sand: '#E9DFD2', moss: '#647660' },
      boxShadow: { card: '0 12px 35px rgba(67, 48, 36, .09)' }
    }
  },
  plugins: []
};
