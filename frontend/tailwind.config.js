/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#3F5A44',
          soft: '#E9EFE8',
        },
        gold: {
          DEFAULT: '#B8893A',
          soft: '#FBF4E4',
        },
        ink: {
          DEFAULT: '#1D1B18',
          soft: '#9A958D',
        },
        line: '#EAE7E1',
        bg: {
          DEFAULT: '#FFFFFF',
          soft: '#F7F6F2',
        },
      },
    },
  },
  plugins: [],
};
