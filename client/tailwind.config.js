/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Matches the CarePoint reference design: deep navy sidebar,
        // cyan/blue accents, soft slate surfaces.
        brand: {
          navy: '#0f2537',
          navyLight: '#16324a',
          primary: '#0ea5b7',
          primaryDark: '#0b8a99',
          accent: '#2dd4bf',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
