/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7f0',
          100: '#d9ead9',
          200: '#b3d5b3',
          300: '#8cc08c',
          400: '#66ab66',
          500: '#4a7c4a',
          600: '#3d6640',
          700: '#2f4f30',
          800: '#223923',
          900: '#152315',
        },
        accent: {
          50: '#f7f9ed',
          100: '#e8edc4',
          200: '#d9e19b',
          300: '#cad672',
          400: '#bbca49',
          500: '#a4b83a',
          600: '#8a9c31',
          700: '#6f7f28',
          800: '#54621f',
          900: '#3a4515',
        },
      },
    },
  },
  plugins: [],
};
